# 🧠 Prompting Protocol

This document outlines the **Prompting Protocol** used in the development and testing of **Edumate**, an AI-powered K-12 tutoring application.  
Edumate is designed to enhance students’ mathematical learning experiences through structured guidance, AI-based feedback, quiz generation, and personalized progress insights.  

The **Prompting Protocol** defines how different **AI models** (e.g., ChatGPT, Gemini, Copilot) are prompted, evaluated, and compared across structured educational scenarios.  
Each scenario below represents a distinct learning experience within Edumate.  
Four supplementary files accompany this document — each focusing on **typical**, **edge**, and **failure** prompt cases for every AI tool under evaluation.

---

## ⚙️ Core Scenarios

- **S1 Structured Problem-Solving Practice:** Provide guided exercises that lead students through each phase of problem-solving — from understanding and strategizing to execution, verification, and exploring alternate methods.  
- **S2 AI-Powered Solution Feedback:** Let students upload or input their solutions, verify correctness, and receive guided feedback pinpointing and explaining errors.  
- **S3 Mathematical Quiz Generation:** Generate multiple-choice math questions with misconception-based distractors for selected grade levels and topics.  
- **S4 Parent Progress Reporting (Edge):** Create parent-friendly progress reports based on a student’s performance data.

---

## 🧩 Tasks for Each Scenario

### **S1. Structured Problem-Solving Practice**
**Scenario:**  
Students learn systematic approaches to solving mathematical problems by understanding the problem, selecting an appropriate strategy, executing steps logically, verifying results, and exploring alternate methods.

**Tasks:**  
- **S1-T1 Problem Understanding:** Break down word problems into smaller, manageable components.  
- **S1-T2 Strategy Selection:** Identify and justify the best method to approach a given problem (e.g., algebraic, graphical, arithmetic).  
- **S1-T3 Step-by-Step Execution:** Show all intermediate steps clearly and logically.  
- **S1-T4 Verification:** Check final answers for accuracy and reasonableness.  
- **S1-T5 Alternative Methods:** Demonstrate multiple approaches to the same problem when possible.

---

### **S2. AI-Powered Solution Feedback**
**Scenario:**  
Students upload or input their written math solutions. The AI analyzes correctness, identifies mistakes, and provides guided feedback or detailed correction steps.

**Tasks:**  
- **S2-T1 Solution Input:** Accept text-based or image-based solution uploads.  
- **S2-T2 Answer Verification:** Compare the student’s result with the correct solution.  
- **S2-T3 Step Analysis:** Examine each procedural step for logical or computational errors.  
- **S2-T4 Error Highlighting:** Identify where the mistake occurred and explain why.  
- **S2-T5 Guided Correction:** Provide detailed steps to correct the mistake while promoting conceptual understanding.  
- **S2-T6 Positive Reinforcement:** Offer encouraging messages for correct reasoning or progress.

---

### **S3. Mathematical Quiz Generation**
**Scenario:**  
Teachers and students generate quizzes with multiple-choice questions containing misconception-based distractors aligned with specific grade levels and topics.

**Tasks:**  
- **S3-T1 Topic Selection:** Choose mathematical domain and subtopic (e.g., fractions, geometry, algebra).  
- **S3-T2 Grade Calibration:** Generate questions tailored to grade-level complexity.  
- **S3-T3 Distractor Design:** Include common misconception options (e.g., forgetting to divide by 2 in area formulas).  
- **S3-T4 Answer Explanation:** Provide reasoning for both correct and incorrect options.  
- **S3-T5 Quiz Export:** Allow export in printable or digital format.

---

### **S4. Parent Progress Reporting (Edge)**
**Scenario:**  
Parents receive progress reports summarizing their child’s mathematical learning, strengths, weaknesses, and growth over time in a parent-friendly format.

**Tasks:**  
- **S4-T1 Data Aggregation:** Compile results from practice sessions, quizzes, and AI feedback.  
- **S4-T2 Progress Visualization:** Display learning trends using charts or progress bars.  
- **S4-T3 Performance Summary:** Highlight accuracy, time spent, and completion rates.  
- **S4-T4 Strengths and Weaknesses:** Identify concepts mastered versus areas needing practice.  
- **S4-T5 Recommendations:** Suggest targeted exercises for improvement.  
- **S4-T6 Parent-Friendly Language:** Use simple, encouraging, non-technical explanations.

---

## 📂 Related Files

Each scenario above is tested across multiple AI systems.  
The following Markdown files document **prompt behavior**, **output consistency**, and **failure cases**:

- `S1_Prompt_Tests.md` – Structured Problem-Solving Prompts  
- `S2_Prompt_Tests.md` – Solution Feedback Prompts  
- `S3_Prompt_Tests.md` – Quiz Generation Prompts  
- `S4_Prompt_Tests.md` – Parent Reporting Prompts  

---

## 📘 Purpose of the Protocol

This protocol ensures **consistency**, **transparency**, and **reproducibility** in AI evaluation.  
By standardizing the prompt design and test cases across scenarios, Edumate’s team can systematically compare how different models handle reasoning, pedagogy, personalization, and safety within a K-12 learning context.

---

> 🏫 *Edumate – Making math learning smarter, structured, and student-centric.*