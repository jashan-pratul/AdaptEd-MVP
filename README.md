# AdaptEd — Error-Aware Adaptive Learning

> **AI Tool for Creating Educational Content for Children with Learning Disabilities**

AdaptEd is a research prototype that explores how generative AI can adapt educational content based on the **specific error made by a learner**, rather than simply making questions easier or harder.

The system follows a closed-loop learning process:

**Error → Diagnosis → Pedagogical Strategy → Representation → Reassessment**

---

## 🎯 Problem

Learners with learning difficulties may understand a concept differently even when they receive the same educational material.

Traditional educational content and many adaptive systems may respond to an incorrect answer by:

- marking it wrong
- giving the correct answer
- reducing difficulty
- providing more practice

However, these approaches may not address **why the learner made the error**.

AdaptEd explores a different approach: use the learner's error as evidence for selecting a more suitable way to explain the same concept.

---

## 💡 Solution

AdaptEd analyzes a learner's response and attempts to identify the likely type of difficulty.

It then selects a pedagogical strategy and generates an alternative representation of the same concept.

The learner is subsequently reassessed to determine whether the intervention improved their understanding.

### Example

A learner answers:

> `1/2 + 1/4 = 2/6`

Instead of simply returning:

> ❌ Incorrect. The answer is 3/4.

AdaptEd can identify a likely denominator-related misconception and provide an explanation such as:

```text
1/2 = 2/4

2/4 + 1/4 = 3/4
