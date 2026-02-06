"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { TeacherType } from "@prisma/client";

export async function addTeacher(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  const type = formData.get("type") as TeacherType;

  if (!name) {
    throw new Error("Teacher name is required.");
  }

  if (!Object.values(TeacherType).includes(type)) {
    throw new Error("Invalid teacher type.");
  }

  await prisma.teacher.create({
    data: {
      name,
      type,
    },
  });

  revalidatePath("/dashboard/teachers");
}

export async function deleteTeacher(id: string) {
  await prisma.teacher.delete({
    where: { id },
  });

  revalidatePath("/dashboard/teachers");
}
