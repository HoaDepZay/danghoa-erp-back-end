
    ALTER TRIGGER trg_BAN_CHAM_CONG_PayrollProcessor
ON BAN_CHAM_CONG
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    -- Trigger chỉ kích hoạt xử lý khi cột GioRa được cập nhật dữ liệu mới
    IF UPDATE(GioRa)
    BEGIN
        
        -- BƯỚC 1: Thu thập dữ liệu và tính toán số phút trễ thực tế theo ca
        WITH RawData AS (
            SELECT 
                i.MaCC, i.MaNV, i.Ngay, i.GioVao, i.GioRa,
                -- Tính số giờ làm thực tế của bản ghi mới và cũ (để cộng dồn/bù trừ lũy tiến)
                CAST(DATEDIFF(MINUTE, i.GioVao, i.GioRa) AS FLOAT) / 60.0 AS NewHours,
                CASE WHEN d.GioRa IS NOT NULL THEN CAST(DATEDIFF(MINUTE, d.GioVao, d.GioRa) AS FLOAT) / 60.0 ELSE 0.0 END AS OldHours,
                -- Tính số phút đi trễ
                CASE 
                    WHEN i.GioVao > '08:30:00' AND i.GioVao <= '12:00:00' THEN DATEDIFF(MINUTE, '08:30:00', i.GioVao)
                    WHEN i.GioVao > '13:30:00' AND i.GioVao <= '18:00:00' THEN DATEDIFF(MINUTE, '13:30:00', i.GioVao)
                    ELSE 0
                END AS SoPhutTre,
                nv.LUONG, ISNULL(nv.PhiBHXH, 0) AS PhiBHXH, ISNULL(nv.PhuCap, 0) AS PhuCap,
                d.GioRa AS OldGioRa, d.DiTre AS OldDiTreStr, d.BuoiLamViec AS OldBuoiLamViecStr
            FROM inserted i
            JOIN deleted d ON i.MaCC = d.MaCC
            JOIN NHAN_VIEN nv ON i.MaNV = nv.MANV
            WHERE i.GioRa IS NOT NULL AND i.GioVao IS NOT NULL
              AND (d.GioRa IS NULL OR i.GioRa <> d.GioRa)
        ),
        -- BƯỚC 2: Tính toán mốc Giờ Ra Yêu Cầu tối thiểu để làm bù xóa trễ
        WithRequiredCheckout AS (
            SELECT *,
                CASE 
                    WHEN (GioVao <= '12:00:00' AND GioRa >= '13:30:00') OR (GioVao > '12:00:00') 
                        THEN DATEADD(MINUTE, SoPhutTre * 2, CAST('18:00:00' AS TIME))
                    ELSE DATEADD(MINUTE, SoPhutTre * 2, CAST('12:00:00' AS TIME))
                END AS GioRaYeuCau
            FROM RawData
        ),
        -- BƯỚC 3: Phân loại trạng thái Đi Trễ và Buổi Làm Việc (Đã sửa lỗi phân loại)
        WithStatus AS (
            SELECT *,
                CASE 
                    WHEN SoPhutTre = 0 THEN 'khong'
                    WHEN SoPhutTre > 30 THEN N'Đi trễ ' + CAST(SoPhutTre AS VARCHAR(10)) + N' phút'
                    ELSE 
                        CASE WHEN GioRa >= GioRaYeuCau THEN 'khong' 
                        ELSE N'Đi trễ ' + CAST(SoPhutTre AS VARCHAR(10)) + N' phút (Không bù đủ)' END
                END AS NewDiTre,
                
                -- SỬA LỖI TẠI ĐÂY: Quét mốc kết thúc ngày 18:00 trước để định hình CaNgay và Chieu
                CASE 
                    -- Vào ca sáng và làm đến hết giờ hành chính chiều trở đi -> Cả ngày
                    WHEN GioVao <= '12:00:00' AND GioRa >= '18:00:00' THEN 'CaNgay'
                    -- Vào ca sáng nhưng về sớm trước khi hết chiều -> Chỉ tính buổi Sáng (nếu qua 12:00)
                    WHEN GioVao <= '12:00:00' AND GioRa < '18:00:00' THEN
                        CASE WHEN GioRa >= '12:00:00' THEN 'Sang' ELSE 'KhongDuCong' END
                    -- Vào ca chiều và làm đến hết ca chiều -> Buổi Chiều
                    WHEN GioVao > '12:00:00' AND GioRa >= '18:00:00' THEN 'Chieu'
                    
                    ELSE 'KhongDuCong'
                END AS NewBuoiLamViec
            FROM WithRequiredCheckout
        ),
        -- BƯỚC 4: Tính toán hệ số % lương theo từng loại buổi và gán mức phạt trễ 100k
        WithFactors AS (
            SELECT *,
                -- Tính toán hệ số & phạt cho bản ghi mới cập nhật
                CASE WHEN NewBuoiLamViec = 'Sang' THEN 0.4   -- Sáng hưởng 40%
                     WHEN NewBuoiLamViec = 'Chieu' THEN 0.6  -- Chiều hưởng 60%
                     WHEN NewBuoiLamViec = 'CaNgay' THEN 1.0 -- Cả ngày hưởng 100% 
                     ELSE 0.0 END AS NewFactor,
                CASE WHEN NewDiTre <> 'khong' THEN 100000.0 ELSE 0.0 END AS NewPenalty,
                
                -- Tính toán hệ số & phạt của dữ liệu cũ trước đó (để làm hiệu số bù trừ)
                CASE WHEN OldGioRa IS NOT NULL THEN
                        CASE WHEN OldBuoiLamViecStr = 'Sang' THEN 0.4
                             WHEN OldBuoiLamViecStr = 'Chieu' THEN 0.6
                             WHEN OldBuoiLamViecStr = 'CaNgay' THEN 1.0 ELSE 0.0 END
                     ELSE 0.0 END AS OldFactor,
                CASE WHEN OldGioRa IS NOT NULL AND OldDiTreStr <> 'khong' AND OldDiTreStr IS NOT NULL THEN 100000.0 ELSE 0.0 END AS OldPenalty
            FROM WithStatus
        ),
        -- BƯỚC 5: Quy đổi thành số tiền lương ngày thực tế (Chặn dưới bằng 0 tránh âm tiền lương ngày)
        WithWages AS (
            SELECT *,
                CASE WHEN NewFactor > 0 THEN 
                    CASE WHEN ((LUONG / 30.0) * NewFactor) - NewPenalty < 0 THEN 0 
                         ELSE ((LUONG / 30.0) * NewFactor) - NewPenalty END
                ELSE 0.0 END AS NewDayWage,
                
                CASE WHEN OldGioRa IS NOT NULL AND OldFactor > 0 THEN 
                    CASE WHEN ((LUONG / 30.0) * OldFactor) - OldPenalty < 0 THEN 0 
                         ELSE ((LUONG / 30.0) * OldFactor) - OldPenalty END
                ELSE 0.0 END AS OldDayWage
            FROM WithFactors
        )
        -- Đổ toàn bộ cấu trúc phân tích vào bảng tạm
        SELECT * INTO #FinalProcessedData FROM WithWages;

        --- ========================================================== ---
        --- TIẾN HÀNH ĐỒNG BỘ CẬP NHẬT TRÊN CÁC BẢNG DỮ LIỆU
        --- ========================================================== ---

        -- 1. Cập nhật kết quả phân loại chuẩn vào lại bảng BAN_CHAM_CONG
        UPDATE b
        SET b.DiTre = f.NewDiTre,
            b.BuoiLamViec = f.NewBuoiLamViec
        FROM BAN_CHAM_CONG b
        JOIN #FinalProcessedData f ON b.MaCC = f.MaCC;

        -- 2. Gom nhóm dữ liệu theo Tháng/Năm để đồng bộ sang bảng lương nhân viên
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

        -- 3. Sử dụng MERGE để cộng dồn Real-time vào dòng lương duy nhất của tháng
        MERGE BANG_LUONG AS target
        USING #PayrollSummary AS source
        ON (target.MaNV = source.MaNV AND target.Thang = source.Thang AND target.Nam = source.Nam)
        
        -- Nếu đã có dòng lương tháng này: Tiến hành cộng dồn/bù trừ chênh lệch DeltaWage
        WHEN MATCHED THEN
            UPDATE SET 
                target.GiolamViec = target.GiolamViec + source.DeltaHours,
                target.ThucLanh = CAST(target.ThucLanh + source.DeltaWage AS DECIMAL(18,2)),
                target.BHXH = source.PhiBHXH,
                target.PhuCap = source.PhuCap
        
        -- Nếu là ngày công đầu tiên xuất hiện trong tháng: Tạo mới row lương
        WHEN NOT MATCHED THEN
            INSERT (MaNV, Thang, Nam, GiolamViec, Thuong, BHXH, PhuCap, ThueTNCN, ThucLanh)
            VALUES (
                source.MaNV,
                source.Thang,
                source.Nam,
                source.DeltaHours,
                0, -- Thuong mặc định = 0
                source.PhiBHXH,
                source.PhuCap,
                0, -- ThueTNCN mặc định = 0
                CAST(source.DeltaWage + source.PhuCap - source.PhiBHXH AS DECIMAL(18,2))
            );

        -- Giải phóng bộ nhớ bảng tạm
        DROP TABLE #FinalProcessedData;
        DROP TABLE #PayrollSummary;
    END
END;