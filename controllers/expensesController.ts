import { Request, Response } from "express";
import * as expensesRepository from "../repositories/expensesRepository";

export const getAllExpenses = async (req: Request, res: Response) => {
  try {
    const expenses = await expensesRepository.getExpenses();
    res.json({ success: true, data: expenses });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Lỗi lấy danh sách chi tiêu", error: error.message });
  }
};

export const getExpense = async (req: Request, res: Response) => {
  try {
    const expense = await expensesRepository.getExpenseById(req.params.id as string);
    if (!expense) return res.status(404).json({ success: false, message: "Không tìm thấy khoản chi" });
    res.json({ success: true, data: expense });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Lỗi lấy khoản chi", error: error.message });
  }
};

export const createExpense = async (req: Request, res: Response) => {
  try {
    const { tenKhoanChi, soTien, ngayChi } = req.body;
    const maNvPhuTrach = (req as any).user?.userInfo?.MA_NV;

    if (!tenKhoanChi || !soTien || !ngayChi) {
      return res.status(400).json({ success: false, message: "Vui lòng cung cấp đủ thông tin" });
    }

    const newExpense = await expensesRepository.createExpense({
      tenKhoanChi,
      soTien,
      ngayChi,
      maNvPhuTrach,
    });

    res.status(201).json({ success: true, message: "Tạo khoản chi thành công", data: newExpense });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Lỗi tạo khoản chi", error: error.message });
  }
};

export const updateExpense = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { tenKhoanChi, soTien, ngayChi, trangThai } = req.body;

    if (!tenKhoanChi || !soTien || !ngayChi || !trangThai) {
      return res.status(400).json({ success: false, message: "Vui lòng cung cấp đủ thông tin cập nhật" });
    }

    const updatedExpense = await expensesRepository.updateExpense(id, {
      tenKhoanChi,
      soTien,
      ngayChi,
      trangThai
    });

    res.json({ success: true, message: "Cập nhật thành công", data: updatedExpense });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Lỗi cập nhật khoản chi", error: error.message });
  }
};

export const deleteExpense = async (req: Request, res: Response) => {
  try {
    await expensesRepository.deleteExpense(req.params.id as string);
    res.json({ success: true, message: "Xóa khoản chi thành công" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Lỗi xóa khoản chi", error: error.message });
  }
};
