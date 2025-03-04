import { ObjectId } from "mongodb";
import { Financial } from "../database";
import type { ClinicFinancial } from "../models";

const projection = { Clinic: 0, __v: 0 };

export const getFinancialById = (id: string) => {
  return Financial.findById({ _id: id }, { __v: 0 }).lean();
};
export const getAllFinancial = (Clinic: string) => {
  return Financial.find({ Clinic }, projection);
};

export const postFinancial = async (data: ClinicFinancial) => {
  return Financial.create(data);
};

export const updateFinancialStatus = (id: string, status: string) => {
  return Financial.updateOne({ _id: id }, { status });
};

export const deleteFinancial = (id: ObjectId) => {
  return Financial.deleteOne({ _id: id });
};
