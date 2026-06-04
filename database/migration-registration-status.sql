-- Migration: Registration status workflow for DANG_KY_CHO
-- Run this script once on the target database before deploying the new flow.

IF COL_LENGTH('dbo.DANG_KY_CHO', 'RegistrationStatus') IS NULL
BEGIN
    ALTER TABLE dbo.DANG_KY_CHO
    ADD RegistrationStatus NVARCHAR(20) NOT NULL
        CONSTRAINT DF_DANG_KY_CHO_RegistrationStatus DEFAULT N'PENDING_OTP';
END
GO

IF COL_LENGTH('dbo.DANG_KY_CHO', 'OtpVerifiedAt') IS NULL
BEGIN
    ALTER TABLE dbo.DANG_KY_CHO
    ADD OtpVerifiedAt DATETIME NULL;
END
GO

IF COL_LENGTH('dbo.DANG_KY_CHO', 'ApprovedAt') IS NULL
BEGIN
    ALTER TABLE dbo.DANG_KY_CHO
    ADD ApprovedAt DATETIME NULL;
END
GO

IF COL_LENGTH('dbo.DANG_KY_CHO', 'ApprovedBy') IS NULL
BEGIN
    ALTER TABLE dbo.DANG_KY_CHO
    ADD ApprovedBy NVARCHAR(100) NULL;
END
GO

IF COL_LENGTH('dbo.DANG_KY_CHO', 'RejectReason') IS NULL
BEGIN
    ALTER TABLE dbo.DANG_KY_CHO
    ADD RejectReason NVARCHAR(MAX) NULL;
END
GO

IF COL_LENGTH('dbo.DANG_KY_CHO', 'RejectedAt') IS NULL
BEGIN
    ALTER TABLE dbo.DANG_KY_CHO
    ADD RejectedAt DATETIME NULL;
END
GO

UPDATE dbo.DANG_KY_CHO
SET RegistrationStatus = CASE
    WHEN OtpCode IS NOT NULL AND ExpiredAt IS NOT NULL AND ExpiredAt > GETDATE() THEN N'PENDING_OTP'
    WHEN OtpCode IS NOT NULL AND ExpiredAt IS NOT NULL AND ExpiredAt <= GETDATE() THEN N'EXPIRED'
    ELSE N'PENDING_OTP'
END
WHERE RegistrationStatus IS NULL OR RegistrationStatus = N'';
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.check_constraints
    WHERE name = 'CK_DANG_KY_CHO_RegistrationStatus'
)
BEGIN
    ALTER TABLE dbo.DANG_KY_CHO
    ADD CONSTRAINT CK_DANG_KY_CHO_RegistrationStatus
    CHECK (RegistrationStatus IN (N'PENDING_OTP', N'OTP_VERIFIED', N'APPROVED', N'REJECTED', N'EXPIRED'));
END
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IX_DANG_KY_CHO_RegistrationStatus'
      AND object_id = OBJECT_ID('dbo.DANG_KY_CHO')
)
BEGIN
    CREATE INDEX IX_DANG_KY_CHO_RegistrationStatus
    ON dbo.DANG_KY_CHO (RegistrationStatus, CreatedAt DESC);
END
GO
