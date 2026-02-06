"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type SickReportState = {
  success?: boolean;
  error?: string;
} | null;

export async function submitSickReport(
  _prevState: SickReportState,
  formData: FormData
): Promise<SickReportState> {
  const teacherId = formData.get("teacherId") as string;
  const startDateStr = formData.get("startDate") as string;
  const numberOfDaysStr = formData.get("numberOfDays") as string;

  if (!teacherId || !startDateStr || !numberOfDaysStr) {
    return { error: "Please fill in all fields." };
  }

  const numberOfDays = parseInt(numberOfDaysStr, 10);

  if (isNaN(numberOfDays) || numberOfDays < 1 || numberOfDays > 14) {
    return { error: "Number of days must be between 1 and 14." };
  }

  const startDate = new Date(startDateStr + "T00:00:00");

  if (isNaN(startDate.getTime())) {
    return { error: "Please enter a valid start date." };
  }

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + numberOfDays - 1);

  try {
    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
    });

    if (!teacher) {
      return { error: "Teacher not found. Please select a valid teacher." };
    }

    await prisma.sickReport.create({
      data: {
        teacherId,
        startDate,
        endDate,
      },
    });

    revalidatePath("/");

    return { success: true };
  } catch {
    return { error: "Something went wrong. Please try again." };
  }
}
