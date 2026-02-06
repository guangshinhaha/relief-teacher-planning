"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function addTimetableEntry(formData: FormData) {
  const teacherId = formData.get("teacherId") as string;
  const dayOfWeek = parseInt(formData.get("dayOfWeek") as string, 10);
  const periodId = formData.get("periodId") as string;
  const className = (formData.get("className") as string)?.trim();
  const subject = (formData.get("subject") as string)?.trim();

  if (!teacherId || !dayOfWeek || !periodId || !className || !subject) {
    throw new Error("All fields are required.");
  }

  await prisma.timetableEntry.upsert({
    where: {
      teacherId_dayOfWeek_periodId: {
        teacherId,
        dayOfWeek,
        periodId,
      },
    },
    update: {
      className,
      subject,
    },
    create: {
      teacherId,
      dayOfWeek,
      periodId,
      className,
      subject,
    },
  });

  revalidatePath("/dashboard/timetable");
}

export async function deleteTimetableEntry(id: string) {
  await prisma.timetableEntry.delete({
    where: { id },
  });

  revalidatePath("/dashboard/timetable");
}
