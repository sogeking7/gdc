# 🚀 Quick Start: AI-Powered Onboarding

## ⚡ Start Testing in 3 Steps

### 1️⃣ Setup Environment
```bash
# Create .env.local file in project root
echo "GOOGLE_GEMINI_API_KEY=your_gemini_api_key_here" > .env.local
```

**Get your Gemini API key**: https://aistudio.google.com/app/apikey

### 2️⃣ Start Dev Server
```bash
cd /Users/nolanch/Desktop/gdcv2/gdc
npm run dev
```

### 3️⃣ Open Onboarding
Navigate to: **http://localhost:3000/onboarding**

---

## 🎯 Quick Test Scenarios

### Test #1: Computer Science Major
1. University: `Stanford University`
2. Major: `Computer Science`
3. Year: `2025`
4. Click Next → **See AI-suggested career paths**
5. Select interests → Click Next → **See AI-suggested skills**
6. Select skills → Click Next
7. Experience: `Student`, Goals: `Become a software engineer`
8. Complete → **Redirects to dashboard**

### Test #2: Business Major
1. Major: `Business Administration`
2. Select AI-suggested interests like "Management Consulting"
3. Add custom interest: `Social Entrepreneurship`
4. See AI generate relevant skills
5. Add custom skill: `Negotiation`
6. Complete onboarding

### Test #3: Custom Path
1. Use any major (e.g., `Psychology`)
2. Select from AI suggestions
3. Click "Other" to add: `UX Research`
4. See skills adapt to your selections
5. Complete the flow

---

## ✅ What to Look For

### AI Features Working:
- ✨ "AI-suggested for [Major]" label appears
- Career interests automatically suggested
- Skills categorized (Technical, Professional, Soft, Tools)
- Priority skills highlighted at top
- Loading spinners during AI calls (1-4 seconds)

### Interactive Features:
- ✅ "Other" button for custom interests
- ✅ Custom skill input with tags
- ✅ Back navigation preserves data
- ✅ Validation prevents incomplete forms
- ✅ Smooth transitions between steps

### Data Persistence:
- Check Redux DevTools → `user` slice
- Check localStorage → `onboardingData`
- Dashboard shows personalized role

---

## 📱 View Files Created

**API Routes**:
- `src/app/api/ai/career-interests/route.ts`
- `src/app/api/ai/skill-suggestions/route.ts`

**Main Component**:
- `src/app/onboarding/page.tsx`

**Documentation**:
- `AI_ONBOARDING_SUMMARY.md` - Full implementation details
- `AI_ONBOARDING_GUIDE.md` - How it works
- `ONBOARDING_TEST_GUIDE.md` - Comprehensive testing guide

---

## 🐛 Troubleshooting

**AI suggestions not loading?**
```bash
# Check if API key is set
cat .env.local

# Restart dev server after adding key
npm run dev
```

**Want to test again?**
```javascript
// In browser console:
localStorage.clear()
location.reload()
```

**Check API calls:**
- Open DevTools → Network tab
- Filter: `/api/ai/`
- Watch for `career-interests` and `skill-suggestions` calls

---

## 🎨 Key Features Implemented

✅ 4-step AI-powered onboarding wizard
✅ Dynamic career interests based on major (AI)
✅ Dynamic skills based on interests + major (AI)
✅ "Other" option for custom interests
✅ Custom skill additions
✅ Priority skills highlighting
✅ Category-based skill organization
✅ Form validation and loading states
✅ Data saved to Redux + localStorage
✅ Beautiful, modern UI with animations

---

## 📊 Next Steps

After testing onboarding, the data will power:
1. **Dashboard** - Personalized recommendations
2. **Resume Builder** - Pre-filled skills
3. **Interview Prep** - Role-specific questions
4. **Career Explorer** - Matched career paths

---

## 💡 Pro Tips

1. **Try different majors** to see AI variety
2. **Add custom items** to test flexibility
3. **Use browser DevTools** to inspect data
4. **Check Network tab** for API performance
5. **Test back navigation** for data persistence

---

**Have fun testing! 🎉**

If you find any issues, check the comprehensive guides:
- `AI_ONBOARDING_GUIDE.md`
- `ONBOARDING_TEST_GUIDE.md`
- `AI_ONBOARDING_SUMMARY.md`

