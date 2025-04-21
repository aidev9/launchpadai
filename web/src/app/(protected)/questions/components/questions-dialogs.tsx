"use client";

import { useQuestions } from "../context/questions-context";
import { QuestionsActionDialog } from "./questions-action-dialog";
import { QuestionsDeleteDialog } from "./questions-delete-dialog";
import { QuestionsViewDialog } from "./questions-view-dialog";

export function QuestionsDialogs() {
  const { open } = useQuestions();

  return (
    <>
      {open === "add" && <QuestionsActionDialog key="add" mode="add" />}
      {open === "edit" && <QuestionsActionDialog key="edit" mode="edit" />}
      {open === "delete" && <QuestionsDeleteDialog />}
      {open === "view" && <QuestionsViewDialog />}
    </>
  );
}
