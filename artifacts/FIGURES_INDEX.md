# Figures and Charts Index

This document provides an index of all figures, charts, and visualizations available in the EduMate artifact package.

## Location

All figures are located in: `application/docs/images/`

## User Survey Results

### Module Feedback

1. **S1 Module Feedback** (`S1_Feedback.png`)
   - User ratings for S1 Structured Problem-Solving Practice
   - Shows "Useful" and "Very useful" ratings
   - Source: User survey results

2. **S2 Module Feedback** (`S2_Feedback.png`)
   - User ratings for S2 AI-Powered Solution Feedback
   - Shows "Effective" and "Very effective" ratings
   - Source: User survey results

3. **S3 Module Feedback** (`S3_Feedback.png`)
   - User ratings for S3 Mathematical Quiz Generation
   - Shows mixed ratings (Neutral, Well, Very well)
   - Source: User survey results

### Dashboard Feedback

4. **Progress Tracking Feedback** (`progress_Feedback.png`)
   - User ratings for progress tracking helpfulness
   - Shows "Helpful", "Neutral", and "Very helpful" ratings
   - Source: User survey results

5. **Parent Dashboard Feedback** (`pdboard_Feedback.png`)
   - User ratings for parent dashboard usefulness
   - Shows "Useful" and "Very useful" ratings
   - Source: User survey results

6. **Learning Controls Feedback** (`controls.png`)
   - User ratings for parent controls ease of use
   - Shows "Easy" and "Very easy" ratings
   - Source: User survey results

### Expression Clarity

7. **Mathematical Expression Feedback** (`math_Feedback.png`)
   - User ratings for mathematical expression clarity
   - Shows "Clear" and "Neutral" ratings
   - Source: User survey results

### General Feedback

8. **Positive Feedback** (`good.png`)
   - User comments on positive aspects
   - Mentions: Color scheme, navigation, font size
   - Source: User survey open-ended responses

9. **Areas for Improvement** (`improve.png`)
   - User suggestions for improvements
   - Primary concern: Load speed
   - Additional: Quiz answers visibility, more subjects, gamification
   - Source: User survey open-ended responses

## System Screenshots

### Learning Modules

10. **S1 Module Screenshot** (`S1.png`)
    - Screenshot of S1 Structured Problem-Solving Practice interface
    - Shows grade selector, topic selector, and solution display
    - Purpose: Demonstrate S1 module UI

11. **S2 Module Screenshot** (`S2.png`)
    - Screenshot of S2 AI-Powered Solution Feedback interface
    - Shows question input, solution upload, and feedback display
    - Purpose: Demonstrate S2 module UI

12. **S3 Module Screenshot** (`S3.png`)
    - Screenshot of S3 Mathematical Quiz Generation interface
    - Shows quiz generation form, question display, and answer selection
    - Purpose: Demonstrate S3 module UI

### Dashboard

13. **Parent Dashboard Screenshot** (`pdboard.png`)
    - Screenshot of parent dashboard interface
    - Shows progress charts, topic heatmap, time tracking, and controls
    - Purpose: Demonstrate parent dashboard UI

### Database Schema

14. **Database Schema Diagram** (`supabase_database_schema.png`)
    - Visual representation of database schema
    - Shows tables, relationships, and key fields
    - Purpose: Document database structure

## Architecture Diagrams

**Location:** `application/docs/Architecture/`

### System Architecture

15. **High-Level Architecture** (`Architecture.png`)
    - Overall system architecture diagram
    - Shows frontend, backend, database, and external services
    - Purpose: System overview

16. **Backend Components** (`Backend Components.png`)
    - Backend service architecture
    - Shows API endpoints, RAG pipeline, and database connections
    - Purpose: Backend structure documentation

### Flow Diagrams

17. **Tutor Question Flow (S1 & S2)** (`Tutor Question Flow (S1 & S2).png`)
    - Flow diagram for tutoring modules
    - Shows RAG pipeline, query processing, and response generation
    - Purpose: Document tutoring workflow

18. **Quiz Generation Flow (S3)** (`Quiz Generation Flow (S3).png`)
    - Flow diagram for quiz generation
    - Shows quiz creation, RAG retrieval, and question generation
    - Purpose: Document quiz workflow

19. **Authentication Flow** (`Authentication Flow.png`)
    - Authentication and session management flow
    - Shows login, signup, and session handling
    - Purpose: Document authentication workflow

### Database Diagrams

20. **Core Tables** (`Core Tables.png`)
    - Database table structure diagram
    - Shows core tables and relationships
    - Purpose: Document database design

## Additional Resources

### Project Resources

**Location:** `resources/` (project root)

21. **Student Login** (`slogin.png`)
    - Student login screen screenshot

22. **Parent Login** (`plogin.png`)
    - Parent login screen screenshot

23. **Student Dashboard** (`sdboard.png`)
    - Student dashboard screenshot

24. **Profile** (`profile.jpeg`)
    - User profile page screenshot

25. **Additional Module Screenshots:**
    - `S21.png` - S2 module variant
    - `S31.png`, `S32.png` - S3 module variants

## Performance Charts

**Note:** Detailed performance charts (learning curves, cost analysis) were not generated during the evaluation phase. Performance metrics are documented numerically in the final report (Section 5.6).

### Available Performance Data

- **API Response Times:** Documented in FINAL_REPORT.md (Section 5.6)
- **Memory Usage Patterns:** Documented in FINAL_REPORT.md (Section 5.6)
- **Vector Search Performance:** Documented in FINAL_REPORT.md (Section 5.6)
- **Error Rates:** Documented in FINAL_REPORT.md (Section 5.6)

## Figure Usage in Report

All figures are referenced in the final report:
- **User Survey Results:** Section 5.5
- **System Screenshots:** Section 3.5
- **Architecture Diagrams:** Section 3.4
- **Database Schema:** Section 3.4

## Accessing Figures

### View All Figures

```bash
# Navigate to images directory
cd application/docs/images

# List all PNG files
ls -la *.png

# View specific figure (macOS)
open S1_Feedback.png

# View specific figure (Linux)
xdg-open S1_Feedback.png
```

### Include in Documentation

Figures can be referenced in Markdown:
```markdown
![S1 Module Feedback](application/docs/images/S1_Feedback.png)
```

## Figure Formats

- **Format:** PNG (most figures)
- **Format:** JPEG (profile image)
- **Resolution:** Varies (screenshots and diagrams)
- **Color:** Full color

## Figure Generation

### User Survey Figures

Generated from user survey responses collected during evaluation phase. Survey data processed and visualized.

### System Screenshots

Captured directly from running application during development and testing.

### Architecture Diagrams

Created using diagramming tools (specific tool not documented) to represent system architecture and workflows.

## Notes

- All figures are included in the repository
- Figures are referenced in the final report
- Additional figures may be available in the project documentation
- For questions about specific figures, refer to the final report sections

