-- Chỉ kích hoạt xử lý khi cột GioRa có sự thay đổi dữ liệu
create TRIGGER trg_BAN_CHAM_CONG_PayrollProcessor
ON BAN_CHAM_CONG
AFTER UPDATE
AS
BEGIN
IF UPDATE(GioRa)
BEGIN
    
    -- BƯỚC 1: Trích xuất dữ liệu thô và tính toán số phút trễ, số giờ làm việc
    SELECT 
        i.MaCC, i.MaNV, i.Ngay, i.GioVao, i.GioRa,
        -- Tính số giờ làm thực tế của bản ghi mới và cũ (để bù trừ)
        CAST(DATEDIFF(MINUTE, i.GioVao, i.GioRa) AS FLOAT) / 60.0 AS NewHours,
        CASE WHEN d.GioRa IS NOT NULL THEN CAST(DATEDIFF(MINUTE, d.GioVao, d.GioRa) AS FLOAT) / 60.0 ELSE 0.0 END AS OldHours,
        -- Tính số phút đi trễ dựa theo ca làm việc ban sáng/ban chiều
        CASE 
            WHEN i.GioVao > '08:30:00' AND i.GioVao <= '12:00:00' THEN DATEDIFF(MINUTE, '08:30:00', i.GioVao)
            WHEN i.GioVao > '13:30:00' AND i.GioVao <= '18:00:00' THEN DATEDIFF(MINUTE, '13:30:00', i.GioVao)
            ELSE 0
        END AS SoPhutTre,
        nv.LUONG, ISNULL(nv.PhiBHXH, 0) AS PhiBHXH, ISNULL(nv.PhuCap, 0) AS PhuCap,
        d.GioRa AS OldGioRa, d.DiTre AS OldDiTreStr, d.BuoiLamViec AS OldBuoiLamViecStr
    INTO #Step1
    FROM inserted i
    JOIN deleted d ON i.MaCC = d.MaCC
    JOIN NHAN_VIEN nv ON i.MaNV = nv.MANV
    WHERE i.GioRa IS NOT NULL AND i.GioVao IS NOT NULL
      AND (d.GioRa IS NULL OR i.GioRa <> d.GioRa);

    -- BƯỚC 2: Tính toán mốc Giờ Ra Yêu Cầu tối thiểu để làm bù
    SELECT *,
        CASE 
            WHEN (GioVao <= '12:00:00' AND GioRa >= '13:30:00') OR (GioVao > '12:00:00') 
                THEN DATEADD(MINUTE, SoPhutTre * 2, CAST('18:00:00' AS TIME))
            ELSE DATEADD(MINUTE, SoPhutTre * 2, CAST('12:00:00' AS TIME))
        END AS GioRaYeuCau
    INTO #Step2
    FROM #Step1;

    -- BƯỚC 3: Xác định chính xác chuỗi trạng thái NewDiTre và NewBuoiLamViec
    SELECT *,
        CASE 
            WHEN SoPhutTre = 0 THEN 'khong'
            WHEN SoPhutTre > 30 THEN N'Đi trễ ' + CAST(SoPhutTre AS VARCHAR(10)) + N' phút'
            ELSE 
                CASE WHEN GioRa >= GioRaYeuCau THEN 'khong' 
                ELSE N'Đi trễ ' + CAST(SoPhutTre AS VARCHAR(10)) + N' phút (Không bù đủ)' END
        END AS NewDiTre,
        CASE 
            WHEN GioVao <= '12:00:00' AND GioRa >= '13:30:00' THEN
                CASE WHEN GioRa >= GioRaYeuCau THEN 'CaNgay'
                     WHEN GioRa >= DATEADD(MINUTE, SoPhutTre * 2, CAST('12:00:00' AS TIME)) THEN 'Sang'
                     ELSE 'KhongDuCong' END
            WHEN GioVao <= '12:00:00' AND GioRa < '13:30:00' THEN
                CASE WHEN GioRa >= DATEADD(MINUTE, SoPhutTre * 2, CAST('12:00:00' AS TIME)) THEN 'Sang'
                     ELSE 'KhongDuCong' END
            WHEN GioVao > '12:00:00' THEN
                CASE WHEN GioRa >= GioRaYeuCau THEN 'Chieu' ELSE 'KhongDuCong' END
            ELSE 'KhongDuCong'
        END AS NewBuoiLamViec
    INTO #Step3
    FROM #Step2;

    -- BƯỚC 4: Tính toán hệ số phần trăm lương dựa theo buổi và áp mức phạt đi trễ
    SELECT *,
        -- Hệ số buổi làm việc mới
        CASE WHEN NewBuoiLamViec = 'Sang' THEN 0.4
             WHEN NewBuoiLamViec = 'Chieu' THEN 0.6
             WHEN NewBuoiLamViec = 'CaNgay' THEN 1.0 ELSE 0.0 END AS NewFactor,
        -- Phạt 100k nếu trạng thái ghi nhận là đi trễ
        CASE WHEN NewDiTre <> 'khong' THEN 100000.0 ELSE 0.0 END AS NewPenalty,
        
        -- Hệ số buổi làm việc cũ (phục vụ tính toán bù trừ sai lệch)
        CASE WHEN OldGioRa IS NOT NULL THEN
                CASE WHEN OldBuoiLamViecStr = 'Sang' THEN 0.4
                     WHEN OldBuoiLamViecStr = 'Chieu' THEN 0.6
                     WHEN OldBuoiLamViecStr = 'CaNgay' THEN 1.0 ELSE 0.0 END
             ELSE 0.0 END AS OldFactor,
        -- Phạt đi trễ cũ
        CASE WHEN OldGioRa IS NOT NULL AND OldDiTreStr <> 'khong' AND OldDiTreStr IS NOT NULL THEN 100000.0 ELSE 0.0 END AS OldPenalty
    INTO #Step4
    FROM #Step3;

    -- BƯỚC 5: Tính thành tiền Lương Ngày Hôm Đó (Có chặn dưới là 0 để tránh âm lương ngày nếu phạt nặng)
    SELECT *,
        CASE 
            WHEN NewFactor > 0 THEN 
                CASE WHEN ((LUONG / 30.0) * NewFactor) - NewPenalty < 0 THEN 0 
                     ELSE ((LUONG / 30.0) * NewFactor) - NewPenalty END
            ELSE 0.0 
        END AS NewDayWage,
        
        CASE 
            WHEN OldGioRa IS NOT NULL AND OldFactor > 0 THEN 
                CASE WHEN ((LUONG / 30.0) * OldFactor) - OldPenalty < 0 THEN 0 
                     ELSE ((LUONG / 30.0) * OldFactor) - OldPenalty END
            ELSE 0.0 
        END AS OldDayWage
    INTO #FinalProcessedData
    FROM #Step4;

    --- ========================================================== ---
    --- THỰC THI ĐỒNG BỘ DỮ LIỆU VÀO CÁC BẢNG ĐÍNH KÈM
    --- ========================================================== ---

    -- 1. Cập nhật ngược lại các thông tin phân loại vào bảng BAN_CHAM_CONG
    UPDATE b
    SET b.DiTre = f.NewDiTre,
        b.BuoiLamViec = f.NewBuoiLamViec
    FROM BAN_CHAM_CONG b
    JOIN #FinalProcessedData f ON b.MaCC = f.MaCC;

    -- 2. Gom nhóm dữ liệu theo Tháng/Năm trước khi MERGE vào BANG_LUONG
    SELECT 
        MaNV,
        MONTH(Ngay) AS Thang,
        YEAR(Ngay) AS Nam,
        SUM(NewHours - OldHours) AS DeltaHours,
        SUM(NewDayWage - OldDayWage) AS DeltaWage,
        MAX(PhiBHXH) AS PhiBHXH,
        MAX(PhuCap) AS PhuCap
    INTO #PayrollSummary
    FROM #FinalProcessedData
    GROUP BY MaNV, MONTH(Ngay), YEAR(Ngay);

    -- 3. Đồng bộ lũy tiến tổng tiền thực lãnh vào bảng BANG_LUONG
    MERGE BANG_LUONG AS target
    USING #PayrollSummary AS source
    ON (target.MaNV = source.MaNV AND target.Thang = source.Thang AND target.Nam = source.Nam)
    
    -- Nếu đã tồn tại dòng lương tháng này: Tiến hành cộng dồn/bù trừ Delta chênh lệch
    WHEN MATCHED THEN
        UPDATE SET 
            target.GiolamViec = target.GiolamViec + source.DeltaHours,
            target.ThucLanh = CAST(target.ThucLanh + source.DeltaWage AS DECIMAL(18,2)),
            target.BHXH = source.PhiBHXH,
            target.PhuCap = source.PhuCap
    
    -- Nếu là ngày công đầu tiên của tháng: Khởi tạo dòng lương mới tinh
    WHEN NOT MATCHED THEN
        INSERT (MaNV, Thang, Nam, GiolamViec, Thuong, BHXH, PhuCap, ThueTNCN, ThucLanh)
        VALUES (
            source.MaNV,
            source.Thang,
            source.Nam,
            source.DeltaHours,
            0, -- Thưởng mặc định = 0
            source.PhiBHXH,
            source.PhuCap,
            0, -- Thuế mặc định = 0
            CAST(source.DeltaWage + source.PhuCap - source.PhiBHXH AS DECIMAL(18,2))
        );

    -- Xóa bỏ các bảng tạm sau khi kết thúc phiên làm việc của Trigger
    DROP TABLE #Step1;
    DROP TABLE #Step2;
    DROP TABLE #Step3;
    DROP TABLE #Step4;
    DROP TABLE #FinalProcessedData;
    DROP TABLE #PayrollSummary;
END;