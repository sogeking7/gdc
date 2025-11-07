# 🚀 Testing the AI-Powered Onboarding

## Quick Start

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Navigate to the onboarding page**:
   ```
   http://localhost:3000/onboarding
   ```

## Test Scenarios

### ✅ Scenario 1: Computer Science Major
**Step 1 - Academic Background**:
- University: "Stanford University"
- Major: "Computer Science"
- Graduation Year: "2025"
- GPA: "3.8" (optional)

**Expected Result**: Click "Next" → AI generates career interests like:
- Software Engineering
- Data Science
- Machine Learning
- Cloud Computing
- Cybersecurity
- etc.

---

### ✅ Scenario 2: Business Major
**Step 1 - Academic Background**:
- University: "Harvard Business School"
- Major: "Business Administration"
- Graduation Year: "2026"

**Expected Result**: Click "Next" → AI generates career interests like:
- Management Consulting
- Product Management
- Marketing Strategy
- Business Development
- Finance & Accounting
- etc.

---

### ✅ Scenario 3: Design Major
**Step 1 - Academic Background**:
- University: "Rhode Island School of Design"
- Major: "Graphic Design"
- Graduation Year: "2025"

**Expected Result**: Click "Next" → AI generates career interests like:
- UX/UI Design
- Visual Design
- Brand Design
- Motion Graphics
- Creative Direction
- etc.

---

## Step-by-Step Testing

### 📝 Step 1: Academic Background
1. Fill in all required fields (marked with *)
2. Note that "Next" button is disabled until all required fields are filled
3. Click "Next"
4. Watch the loading state: "Generating suggestions..."
5. **Verify**: AI call to `/api/ai/career-interests` in Network tab

### 🎯 Step 2: Career Interests
1. **Verify**: AI-suggested interests appear based on your major
2. Each interest should show:
   - ✨ "AI-suggested for [Major]" label at top
   - Interest name
   - Brief description
3. **Test**: Select multiple interests
4. **Test**: Click "Other (Add custom interest)"
   - Enter a custom interest
   - Click "Add"
   - Verify it appears as an option and is auto-selected
5. Click "Next"
6. Watch loading state: "Generating skills..."
7. **Verify**: AI call to `/api/ai/skill-suggestions` in Network tab

### 🛠️ Step 3: Key Skills
1. **Verify**: Priority skills appear at the top in highlighted cards
2. **Verify**: Skills are organized by category:
   - Technical Skills
   - Professional Skills
   - Soft Skills
   - Tools & Technologies
3. Each skill should show:
   - Name
   - Difficulty badge (beginner/intermediate/advanced)
   - Description of why it matters
4. **Test**: Select multiple skills across categories
5. **Test**: Add custom skills:
   - Type a skill name
   - Press Enter or click + button
   - Verify it appears as a tag with X button
   - Click X to remove
6. **Verify**: "Next" button disabled if no skills selected
7. Click "Next"

### 💼 Step 4: Experience & Goals
1. **Test**: Select experience level from dropdown
2. **Test**: (Optional) Add projects/internships description
3. **Test**: Add career goals (required)
4. **Verify**: "Complete Onboarding" button disabled until required fields filled
5. Click "Complete Onboarding"
6. **Verify**: Redirects to dashboard (/)

---

## Verification Checklist

After completing onboarding, verify the following:

### ✅ Redux Store (Check with Redux DevTools)
- [ ] `onboardingCompleted: true`
- [ ] `profileCompletion: 90`
- [ ] `role` is set based on interests/goals
- [ ] `education` = "Major from University"
- [ ] `interests` array populated
- [ ] `skillsText` contains comma-separated skills
- [ ] `experience` set
- [ ] `careerGoals` set

### ✅ LocalStorage
Open browser DevTools → Application → Local Storage → localhost:3000

Check for key: `onboardingData`
```json
{
  "university": "...",
  "major": "...",
  "graduationYear": "...",
  "gpa": "...",
  "interests": [...],
  "skills": [...],
  "experience": "...",
  "projects": "...",
  "goals": "...",
  "timestamp": "..."
}
```

### ✅ Dashboard Personalization
Navigate to the dashboard and verify:
- [ ] User profile shows correct role
- [ ] Personalized information appears
- [ ] Career recommendations (if loaded)

---

## Testing Edge Cases

### 🔧 Test 1: Back Navigation
1. Go through all steps
2. At Step 4, click "Back"
3. Verify Step 3 data is preserved
4. Click "Back" again
5. Verify Step 2 data is preserved
6. Make changes and go forward again
7. Verify changes are reflected

### 🔧 Test 2: Skip Onboarding
1. Click "Skip for now" at any step
2. Confirm the dialog
3. Verify redirect to dashboard
4. Verify `onboardingCompleted: true` in Redux

### 🔧 Test 3: Custom Interests & Skills
1. Add custom interest: "Marine Biology Research"
2. Select it and proceed
3. Verify AI generates relevant skills for custom interest
4. Add custom skills not in suggestions
5. Verify they appear in final profile

### 🔧 Test 4: No AI Key (Error Handling)
1. Remove or invalidate `GOOGLE_GEMINI_API_KEY`
2. Restart dev server
3. Try to proceed through onboarding
4. Check browser console for error messages
5. Verify graceful degradation (should show error state)

### 🔧 Test 5: Validation
1. Try clicking "Next" on Step 1 without filling fields
2. Verify button is disabled
3. Fill only some fields
4. Verify button remains disabled
5. Fill all required fields
6. Verify button becomes enabled

---

## API Response Times

Monitor Network tab for:
- `/api/ai/career-interests`: Should respond in 1-3 seconds
- `/api/ai/skill-suggestions`: Should respond in 2-4 seconds

If responses are slow, check:
1. Gemini API key is valid
2. Network connection is stable
3. API quotas are not exceeded

---

## Common Issues & Solutions

### Issue: "AI suggestions not loading"
**Solutions**:
- Check console for errors
- Verify Gemini API key in `.env.local`
- Check API endpoint logs in terminal
- Try refreshing the page

### Issue: "Skills not appearing after selecting interests"
**Solutions**:
- Ensure at least one interest is selected
- Check Network tab for failed API call
- Verify interests data is passed correctly

### Issue: "Data not persisting after onboarding"
**Solutions**:
- Check Redux DevTools for dispatch actions
- Verify localStorage has `onboardingData`
- Ensure `completeOnboarding()` is called
- Check browser console for errors

---

## Performance Benchmarks

Target performance:
- **Step 1 → 2 transition**: < 3 seconds (with AI)
- **Step 2 → 3 transition**: < 4 seconds (with AI)
- **Step 3 → 4 transition**: Instant (no AI)
- **Step 4 → Dashboard**: < 2 seconds

---

## Browser Compatibility

Test on:
- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)

Mobile responsive:
- ✅ iPhone (Safari)
- ✅ Android (Chrome)

---

## Debug Mode

To test without AI (faster iteration):
1. Comment out AI API calls in `page.tsx`
2. Use mock data for testing UI
3. Uncomment when ready to test AI

---

## Success Criteria

The onboarding is working correctly when:
1. ✅ All 4 steps complete without errors
2. ✅ AI suggestions appear in Steps 2 & 3
3. ✅ User can add custom interests and skills
4. ✅ Data is saved to Redux and localStorage
5. ✅ Dashboard shows personalized content
6. ✅ Back navigation preserves data
7. ✅ Validation prevents incomplete submissions
8. ✅ Loading states appear during AI calls
9. ✅ Redirect to dashboard after completion
10. ✅ Skip option works correctly

---

Happy Testing! 🎉

If you encounter any issues, check:
1. Terminal logs for API errors
2. Browser console for client errors
3. Network tab for failed requests
4. Redux DevTools for state issues

