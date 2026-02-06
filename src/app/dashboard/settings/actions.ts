"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function addPeriod(formData: FormData) {
  const number = parseInt(formData.get("number") as string, 10);
  const startTime = formData.get("startTime") as string;
  const endTime = formData.get("endTime") as string;

  if (!number || !startTime || !endTime) {
    throw new Error("All fields are required.");
  }

  await prisma.period.create({
    data: {
      number,
      startTime,
      endTime,
    },
  });

  revalidatePath("/dashboard/settings");
}

export async function deletePeriod(id: string) {
  await prisma.period.delete({
    where: { id },
  });

  revalidatePath("/dashboard/settings");
}
