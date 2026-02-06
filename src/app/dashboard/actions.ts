"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function assignRelief(formData: FormData) {
  const sickReportId = formData.get("sickReportId") as string;
  const timetableEntryId = formData.get("timetableEntryId") as string;
  const reliefTeacherId = formData.get("reliefTeacherId") as string;
  const dateStr = formData.get("date") as string;

  if (!sickReportId || !timetableEntryId || !reliefTeacherId || !dateStr) {
    throw new Error("All fields are required.");
  }

  // Parse date as UTC midnight to avoid timezone shifts
  const date = new Date(dateStr + "T00:00:00.000Z");

  // Verify the timetable entry exists and belongs to the sick report's teacher
  const timetableEntry = await prisma.timetableEntry.findUnique({
    where: { id: timetableEntryId },
    include: { period: true },
  });

  if (!timetableEntry) {
    throw new Error("Timetable entry not found.");
  }

  // Verify the relief teacher is not already assigned for this period on this date
  const existingAssignment = await prisma.reliefAssignment.findFirst({
    where: {
      reliefTeacherId,
      date,
      timetableEntry: {
        periodId: timetableEntry.periodId,
      },
    },
  });

  if (existingAssignment) {
    throw new Error("This teacher is already assigned to cover another period at this time.");
  }

  await prisma.reliefAssignment.create({
    data: {
      sickReportId,
      timetableEntryId,
      reliefTeacherId,
      date,
    },
  });

  revalidatePath("/dashboard");
}

export async function unassignRelief(assignmentId: string) {
  if (!assignmentId) {
    throw new Error("Assignment ID is required.");
  }

  await prisma.reliefAssignment.delete({
    where: { id: assignmentId },
  });

  revalidatePath("/dashboard");
}
