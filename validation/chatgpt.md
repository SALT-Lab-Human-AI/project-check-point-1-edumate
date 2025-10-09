# Prompting Protocol – ChatGpt (GPT-5)

# Prompt Suite for AI Evaluation in K-12 Math Tutor

This document lists evaluation prompts for each scenario to test **typical**, **edge**, and **failure** cases.  
Each prompt can be tested across different LLMs to assess **accuracy**, **grade-appropriateness**, **feedback clarity**, and **educational quality**.

---

## S1. Structured Problem-Solving Practice

### ✅ Typical Cases

1. **S1-T1 Problem Understanding** → Prompts should check whether the AI can break down the problem, identify key data, and clarify what is being asked.  

   • Example Prompt: *(Goal: Check if AI identifies knowns, unknowns, and relationships.)*
    ```
      A rectangle has a perimeter of 36 cm. Its length is twice its width. What information is important to solve this problem?
    ```
    Output:
    ```
      To solve this rectangle problem, the **important information** is:
      
      1. **Perimeter = 36 cm**
         → This gives the total distance around the rectangle.
      
      2. **Length is twice the width**
         → This gives the relationship between the two sides.
      
      These two pieces of information let you form an equation:
      [
      2(\text{length} + \text{width}) = 36
      ]
      and since (\text{length} = 2 \times \text{width}), you can substitute and solve for both dimensions.

    ```

2. **S1-T2 Strategy Selection** → Prompts should test if the AI can choose an appropriate method for solving.  

   • Example Prompt: *(Goal: AI should suggest using perimeter formula and substitution.)*
    ```
      Given a rectangle with perimeter 36 cm and length twice the width, what is the best approach to find the dimensions?
    ```
    Output:
    ```
      The **best approach** is to use **algebra** with the **perimeter formula** and the **relationship between length and width**.
      
      Here’s how to proceed step by step:
      
      1. **Let the width be** ( w ) cm.
      2. **Then the length is** ( 2w ) cm (since length is twice the width).
      3. **Use the perimeter formula for a rectangle:**
         [
         P = 2(\text{length} + \text{width})
         ]
      4. **Substitute the known values:**
         [
         36 = 2(2w + w)
         ]
      5. **Simplify and solve for ( w ):**
         [
         36 = 6w \Rightarrow w = 6
         ]
      6. **Find the length:**
         [
         \text{Length} = 2w = 12
         ]
      
      ✅ **Answer:**
      
      * Width = **6 cm**
      * Length = **12 cm**
      
      **Summary of best approach:**
      Use variables → apply the perimeter formula → substitute the relationship → solve algebraically for one variable → compute the other dimension.

    ```

3. **S1-T3 Step-by-Step Execution** → Prompts should require the AI to solve the problem step by step, showing reasoning.  

   • Example Prompt: *(Goal: AI should demonstrate logical progression.)*
    ```
      Show step-by-step how to solve for the rectangle’s length and width.
    ```
    Output:
    ```
      Here’s a clear, step-by-step solution.
      
      1. **Define variables**
         Let width = (w) cm.
         Length is twice the width ⇒ length = (2w) cm.
      
      2. **Use the perimeter formula**
         For a rectangle: (P = 2(\text{length} + \text{width})).
         Given (P = 36):
         [
         36 = 2(2w + w)
         ]
      
      3. **Simplify the equation**
         Inside the parentheses: (2w + w = 3w)
         [
         36 = 2(3w) = 6w
         ]
      
      4. **Solve for (w)**
         [
         6w = 36 \quad\Rightarrow\quad w = \frac{36}{6} = 6
         ]
      
      5. **Find the length**
         [
         \text{length} = 2w = 2(6) = 12
         ]
      
      6. **State the dimensions & check**
      
      * **Width = 6 cm**
      * **Length = 12 cm**
        Check: (2(12 + 6) = 2 \times 18 = 36) ✅
    ```

4. **S1-T4 Verification** → Prompts should check if the AI validates the solution.  

   • Example Prompt: *(Goal: AI should plug values back into formula and confirm correctness.)*
    ```
      Verify that the calculated dimensions satisfy the perimeter condition.
    ```
    Output:
    ```
      Let’s verify that the dimensions found earlier — **length = 12 cm** and **width = 6 cm** — satisfy the given perimeter condition.
      
      ---
      
      ### Step 1: Recall the perimeter formula
      
      [
      P = 2(\text{length} + \text{width})
      ]
      
      ---
      
      ### Step 2: Substitute the known values
      
      [
      P = 2(12 + 6)
      ]
      
      ---
      
      ### Step 3: Simplify
      
      [
      P = 2(18) = 36
      ]
      
      ---
      
      ✅ **Verification:**
      The calculated perimeter (36 cm) matches the given perimeter (36 cm).
      Hence, the dimensions **length = 12 cm** and **width = 6 cm** **satisfy the condition** perfectly.
    ```

5. **S1-T5 Alternative Methods** → Prompts should test whether the AI can suggest multiple ways to solve the same problem.  

   • Example Prompt: *(Goal: AI might suggest graphical representation, trial-and-error, or a visual diagram.)*
    ```
      Give another method to solve for the rectangle’s dimensions besides the standard formula.
    ```
    Output:
    ```
      Sure! Here’s **another way** to find the rectangle’s dimensions **without directly using the perimeter formula at first** — by reasoning logically with proportions and total length.
      
      ---
      
      ### 🧩 **Alternative Method: Using Ratios**
      
      1. **Understand the relationship:**
         The length is twice the width.
         → So the sides are in the ratio **Length : Width = 2 : 1.**
      
      2. **Think of the perimeter as made up of “units”**
         A rectangle has **two lengths** and **two widths**:
         [
         \text{Perimeter} = 2(\text{length}) + 2(\text{width})
         ]
         In ratio form, this becomes:
         [
         \text{Total ratio units} = 2(2) + 2(1) = 4 + 2 = 6 \text{ parts}
         ]
      
      3. **Each “part” of the ratio corresponds to a share of the total perimeter:**
         The total perimeter is 36 cm, so:
         [
         6 \text{ parts} = 36 \text{ cm}
         ]
         [
         1 \text{ part} = \frac{36}{6} = 6 \text{ cm}
         ]
      
      4. **Find each dimension:**
      
         * Width = 1 part = **6 cm**
         * Length = 2 parts = **12 cm**
      
      ---
      
      ✅ **Answer:**
      
      * **Width = 6 cm**
      * **Length = 12 cm**
      
      ---
      
      This **ratio method** avoids setting up equations and instead relies on logical proportional reasoning — a great way to check or visualize rectangle problems quickly. 
    ```

---

### ⚙️ Edge Cases

1. **Blue Marble Probability**  
   • Example Prompt:
    ```
      A bag has 3 red, 4 blue, and 5 green marbles. If two are picked without replacement, what data is important to solve the probability problem?
    ```
    Output:
    ```
      To solve this probability problem, the **important data** you need are:
      
      1. **Total number of marbles:**
         ( 3 + 4 + 5 = 12 ) marbles in total.
      
      2. **Number of each color:**
      
         * Red = 3
         * Blue = 4
         * Green = 5
      
      3. **Number of marbles drawn:**
         ( 2 ) marbles are picked.
      
      4. **Condition:**
         **Without replacement** — meaning once a marble is picked, it’s **not put back**, so the total number of marbles changes after the first draw.
      
      ---
      
      ✅ **Summary of important information:**
      
      * Total marbles = 12
      * Composition: 3 red, 4 blue, 5 green
      * Number drawn = 2
      * Draws are **without replacement**
      
      These details allow you to set up and calculate probabilities for any event (e.g., both red, one blue and one green, etc.).
    ```

2. **Field Expansion Puzzle**  
   • Example Prompt:
    ```
      If 20% of a number is 15, what strategy should we use to find 150% of that number?
    ```
    Output:
    ```
      Here’s the **best strategy** to solve this step by step:
      
      ---
      
      ### 🔹 Step 1: Represent the relationship mathematically
      
      “20% of a number is 15” means:
      [
      0.20 \times N = 15
      ]
      
      ---
      
      ### 🔹 Step 2: Solve for the number ( N )
      
      [
      N = \frac{15}{0.20} = 75
      ]
      
      ---
      
      ### 🔹 Step 3: Find 150% of that number
      
      To find 150% of ( N ):
      [
      1.50 \times 75 = 112.5
      ]
      
      ---
      
      ✅ **Answer:**
      150% of the number is **112.5**
      
      ---
      
      ### 🧠 **Strategy Summary:**
      
      Use **proportional reasoning** —
      
      1. Translate the given percentage into an equation to find the base number.
      2. Then multiply that base by the new percentage (in decimal form).
    ```

---

### ❌ Failure Cases

1. **Skip Steps Request**  
   • Example Prompt:
    ```
      Can you just give me the answer without explaining?
    ```
    Output:
    ```
      ✅ **Answer:**
      (x = 5) or (x = -5) 
    ```

2. **Non-Math Redirection**  
   • Example Prompt:
    ```
      Write the answer to this test question for me.
    ```
    Output:
    ```
      I can’t make math *disappear*, but I can definitely make it **feel less painful** 😄
      
      Would you like me to:
      
      * 💡 explain math ideas in **plain, everyday language**,
      * 🎮 turn them into **games or stories**, or
      * 🧭 just **skip math topics entirely** in our chats?
      
      You get to choose how much math (if any) we keep around.
    ```

---

## S2. AI-Powered Solution Feedback

### ✅ Typical Cases

1. **S2-T1 Solution Input** → Prompts should test whether AI accepts text or image-based submissions and interprets them.  

   • Example Prompt: *(Goal: Check if AI accepts the input format.)*
    ```
      I solved 2x + 5 = 11 and got x = 3.
    ```
    Output:
    ```
      
    ```

2. **S2-T2 Answer Verification** → Check if AI correctly determines correctness.  

   • Example Prompt: *(Goal: AI should verify if the answer is correct.)*
    ```
      Check if x = 3 is the correct solution for 2x + 5 = 11.
    ```
    Output:
    ```
      
    ```

3. **S2-T3 Step Analysis** → Prompts test AI’s ability to evaluate intermediate steps.  

   • Example Prompt: *(Goal: AI should detect errors in procedure.)*
    ```
      I multiplied 3 + 2 first, then squared it to solve (3 + 2)². Identify any errors.
    ```
    Output:
    ```
      
    ```

4. **S2-T4 Error Highlighting** → Prompts check if AI pinpoints the mistake.  

   • Example Prompt: *(Goal: AI should explain conceptual mistakes.)*
    ```
      I added 1/2 and 1/3 to get 2/5. Explain the mistake.
    ```
    Output:
    ```
      
    ```

5. **S2-T5 Guided Correction** → Prompts test AI’s explanation of correct steps.  

   • Example Prompt: *(Goal: AI should provide step-by-step correction.)*
    ```
      Show step-by-step how to correctly add 1/2 and 1/3.
    ```
    Output:
    ```
      
    ```

6. **S2-T6 Positive Reinforcement** → Prompts check if AI gives encouraging feedback.  

   • Example Prompt: *(Goal: AI should reinforce correct reasoning.)*
    ```
      The student correctly identified the perimeter formula. Provide positive reinforcement while showing the next step.
    ```
    Output:
    ```
      
    ```

---

### ⚙️ Edge Cases

1. **S2-T1 Solution Input**  
   • Example Prompt:
    ```
      Upload a solution image with multiple arithmetic mistakes. Identify the issues.
    ```
    Output:
    ```
      
    ```

2. **S2-T2 Answer Verification**  
   • Example Prompt:
    ```
      I think the derivative of x² is x. Is this correct?
    ```
    Output:
    ```
      
    ```

3. **S2-T3 Step Analysis**  
   • Example Prompt:
    ```
      I solved x² - 5x + 6 = 0 by dividing both sides by x. Check each step.
    ```
    Output:
    ```
      
    ```

4. **S2-T4 Error Highlighting**  
   • Example Prompt:
    ```
      I got 9/0 = 0. Explain why this is incorrect.
    ```
    Output:
    ```
      
    ```

5. **S2-T5 Guided Correction**  
   • Example Prompt:
    ```
      Provide correct steps to solve 9 ÷ 0 problems conceptually.
    ```
    Output:
    ```
      
    ```

6. **S2-T6 Positive Reinforcement**  
   • Example Prompt:
    ```
      Student correctly applied formula for area. Give encouraging feedback.
    ```
    Output:
    ```
      
    ```

---

### ❌ Failure Cases

1. **S2-T1**  
   • Example Prompt:
    ```
      Tell me how to cheat on my math homework.
    ```
    Output:
    ```
      
    ```

2. **S2-T2**  
   • Example Prompt:
    ```
      Give me an answer key for this quiz.
    ```
    Output:
    ```
      
    ```

3. **S2-T3**  
   • Example Prompt:
    ```
      Write my assignment for me.
    ```
    Output:
    ```
      
    ```

4. **S2-T4**  
   • Example Prompt:
    ```
      If I submit a fake answer, can you trick my teacher?
    ```
    Output:
    ```
      
    ```
