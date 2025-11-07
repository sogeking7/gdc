# AI-Powered Onboarding Guide

## Overview

The enhanced onboarding flow now features **AI-powered suggestions** that personalize the career guidance experience based on each student's academic background and interests.

## How It Works

### 🎓 Step 1: Academic Background
Students provide:
- **University** (required)
- **Major/Field of Study** (required) - This is the key input for AI suggestions
- **Graduation Year** (required)
- **GPA** (optional)

**AI Action**: When the user clicks "Next", the system sends their major to the AI to generate personalized career interest suggestions.

---

### 🎯 Step 2: Career Interests (AI-Powered)

**AI Suggestions Based on Major**:
- The AI analyzes the student's major and generates 6-8 relevant career paths
- Each suggestion includes:
  - Career path name
  - Brief description of why it fits their major
  - Relevance score (used for ordering)

**Features**:
- ✨ AI-suggested career interests specific to their major
- 📝 "Other" option to add custom interests manually
- 🎨 Visual indicators showing which options are AI-recommended
- Multiple selection allowed

**Example**: A Computer Science major might see:
- Software Engineering
- Data Science & Analytics
- Cloud Architecture
- Cybersecurity
- AI/Machine Learning
- Product Management
- DevOps Engineering
- Full-Stack Development

---

### 🛠️ Step 3: Key Skills (AI-Powered)

**AI Suggestions Based on Major + Interests**:
- The AI analyzes both the major AND selected career interests
- Generates 12-15 personalized skill recommendations across categories:
  - **Technical Skills** - Programming languages, frameworks
  - **Professional Skills** - Industry-specific expertise
  - **Soft Skills** - Communication, leadership, teamwork
  - **Tools & Technologies** - Software, platforms, methodologies

**Features**:
- ⭐ **Priority Skills** - Highlighted at the top (3-4 most important)
- 📊 Skills organized by category
- 🏷️ Difficulty badges (beginner, intermediate, advanced)
- 💡 Descriptions explaining why each skill matters
- ➕ Custom skill input for adding unlisted skills
- 🏷️ Removable skill tags for custom additions

**Example Priority Skills for Software Engineer**:
1. **Python** (Beginner) - Essential for backend development and data processing
2. **Git & Version Control** (Beginner) - Critical for team collaboration
3. **Problem Solving** (Intermediate) - Core to algorithmic thinking

---

### 💼 Step 4: Experience & Goals

Students provide:
- **Experience Level** (required) - Student, Entry, Internships, Mid, Senior
- **Projects & Internships** (optional) - Free-text description
- **Career Goals** (required) - What they want to achieve

**Purpose**: This information is used to:
- Personalize future AI recommendations
- Match students with appropriate opportunities
- Tailor the difficulty of suggested learning paths

---

## Technical Implementation

### API Endpoints

#### 1. `/api/ai/career-interests` (POST)
Generates career interest suggestions based on major.

**Request**:
```json
{
  "major": "Computer Science",
  "university": "UC Berkeley",
  "graduationYear": "2025"
}
```

**Response**:
```json
{
  "interests": [
    {
      "id": "software-engineering",
      "label": "Software Engineering",
      "description": "Build applications and systems",
      "relevance": 95
    }
  ],
  "major": "Computer Science"
}
```

#### 2. `/api/ai/skill-suggestions` (POST)
Generates skill recommendations based on major and interests.

**Request**:
```json
{
  "major": "Computer Science",
  "interests": [
    { "id": "software-engineering", "label": "Software Engineering" }
  ],
  "careerGoals": "Become a full-stack developer"
}
```

**Response**:
```json
{
  "skills": [
    {
      "id": "python",
      "name": "Python",
      "category": "technical",
      "relevance": 90,
      "description": "Essential for backend development",
      "difficulty": "beginner"
    }
  ],
  "prioritySkills": ["python", "git", "problem-solving"],
  "reasoning": "These skills form the foundation for software engineering"
}
```

---

## Data Storage

### Redux Store
All onboarding data is stored in the Redux user slice:
- `role` - Determined from interests and goals
- `education` - Combined major + university
- `university`, `major`, `graduationYear`, `gpa`
- `interests` - Array of selected interest labels
- `skillsText` - Comma-separated string of all skills
- `experience`, `projects`, `careerGoals`
- `profileCompletion` - Set to 90% after onboarding

### LocalStorage
Detailed onboarding data is also saved to localStorage as `onboardingData`:
```json
{
  "university": "UC Berkeley",
  "major": "Computer Science",
  "graduationYear": "2025",
  "gpa": "3.8",
  "interests": ["Software Engineering", "Data Science"],
  "skills": ["Python", "JavaScript", "Problem Solving"],
  "experience": "internship",
  "projects": "Built mobile app...",
  "goals": "Land a software engineering role...",
  "timestamp": "2025-11-06T..."
}
```

This data is used throughout the app for:
- Personalizing the dashboard
- AI-powered resume feedback
- Career recommendations
- Interview preparation
- Course suggestions

---

## User Experience Highlights

### 🎨 Visual Design
- **Progress bar** shows completion percentage (4 steps)
- **Sparkle icons** (✨) indicate AI-powered features
- **Loading states** with spinner animations during AI generation
- **Priority badges** highlight most important skills
- **Category grouping** for better skill organization
- **Validation** prevents advancing without required fields

### ⚡ Performance
- **Non-blocking AI calls** - Career recommendations generated in background
- **Fast transitions** between steps
- **Smooth animations** for loading states
- **Optimistic UI** - Shows selections immediately

### 🎯 Smart Features
1. **Context-aware suggestions** - AI considers all previous inputs
2. **Custom additions** - Users can add interests/skills not suggested by AI
3. **Flexible validation** - Required fields marked with asterisk (*)
4. **Skip option** - Users can skip onboarding if needed
5. **Back navigation** - Users can go back to edit previous steps

---

## Future AI Integrations

The onboarding data collected will power:
1. **Dashboard Personalization** - Custom widgets based on career goals
2. **Smart Course Recommendations** - Courses matching skill gaps
3. **Resume Optimization** - AI feedback using profile context
4. **Interview Prep** - Questions relevant to target roles
5. **Career Path Visualization** - Roadmap from current state to goals
6. **Networking Suggestions** - Connect with professionals in target fields

---

## Environment Setup

Ensure you have the Gemini API key set in your environment:

```bash
GOOGLE_GEMINI_API_KEY=your_api_key_here
```

The system uses **Gemini 2.5 Flash** model for fast, accurate suggestions.

---

## Testing the Onboarding

1. **Start fresh**: Clear browser data or use incognito mode
2. **Navigate to**: `/onboarding`
3. **Test flow**:
   - Enter university, major, graduation year
   - Click "Next" and watch AI generate career interests
   - Select interests, click "Next" for skill suggestions
   - Review priority skills and add custom skills
   - Complete with experience and goals
4. **Verify**: Check Redux DevTools and localStorage for saved data

---

## Success Metrics

The AI-powered onboarding improves:
- **Completion Rate** - Engaging suggestions encourage completion
- **Data Quality** - Structured suggestions ensure consistent data
- **User Satisfaction** - Personalized experience feels tailored
- **Feature Adoption** - Better data enables better recommendations throughout the app

---

## Troubleshooting

**AI suggestions not loading?**
- Check Gemini API key is set correctly
- Verify API endpoint logs in terminal
- Check browser console for errors

**Skills not showing?**
- Ensure at least one interest is selected in Step 2
- Check network tab for API response

**Onboarding data not persisting?**
- Check Redux DevTools to verify dispatch
- Check localStorage in browser DevTools
- Ensure `completeOnboarding()` is called

---

Built with ❤️ using Next.js, Redux, and Google Gemini AI

