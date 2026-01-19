import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { question, Submission } from "@/types";
import type { Dispatch, SetStateAction } from "react";
import { Label } from "@/components/ui/label";

const ExamRadio = ({
  question: q,
  setAnswers,
  submission,
  answers,
}: {
  question: question;
  submission: Submission | null;
  setAnswers: Dispatch<SetStateAction<Record<string, string>>>;
  answers: Record<string, string>;
}) => {
  return (
    <RadioGroup
      onValueChange={(val) => {
        if (submission) return;
        setAnswers((prev) => ({ ...prev, [q._id]: val }));
      }}
      value={
        submission
          ? submission.answers.find((a) => a.questionId === q._id)?.answer
          : answers[q._id]
      }
      disabled={!!submission}
    >
      {q.options.map((opt, i) => {
        // 1. Get the student's answer for this specific question
        const studentAnswer = submission?.answers.find(
          (a) => a.questionId === q._id
        )?.answer;

        // 2. Determine States (Only valid if submission exists)
        const isCorrectAnswer = submission && opt === q.correctAnswer;
        const isStudentSelected = submission && opt === studentAnswer;
        const isWrongSelection = isStudentSelected && !isCorrectAnswer;

        // 3. Dynamic Styling
        let containerStyle =
          "flex items-center space-x-2 p-3 rounded-md border transition-all ";

        if (submission) {
          if (isCorrectAnswer) {
            // Green style for the correct answer
            containerStyle +=
              "bg-green-50 border-green-500 text-green-700 dark:bg-green-900/20";
          } else if (isWrongSelection) {
            // Red style for wrong selection
            containerStyle +=
              "bg-red-50 border-red-500 text-red-700 dark:bg-red-900/20";
          } else {
            // Dim other options
            containerStyle += "border-transparent opacity-60";
          }
        } else {
          // Normal state (Taking exam)
          containerStyle +=
            "border-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800";
        }
        return (
          <div key={i} className={containerStyle}>
            <RadioGroupItem
              value={opt}
              id={`${q._id}-${i}`}
              className={
                submission
                  ? isCorrectAnswer
                    ? "text-green-600 border-green-600"
                    : isWrongSelection
                    ? "text-red-600 border-red-600"
                    : ""
                  : ""
              }
            />
            <Label
              htmlFor={`${q._id}-${i}`}
              className="cursor-pointer w-full py-1 font-normal flex justify-between"
            >
              <span>{opt}</span>
              {/* 4. Text Badges */}
              {submission && (
                <span className="text-xs font-bold ml-2">
                  {isCorrectAnswer && "(Correct Answer)"}
                  {isWrongSelection && "(Your Choice)"}
                  {isStudentSelected && isCorrectAnswer && "(Your Choice)"}
                </span>
              )}
            </Label>
          </div>
        );
      })}
    </RadioGroup>
  );
};

export default ExamRadio;
