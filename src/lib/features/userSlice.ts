import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface Course {
  name: string
  provider: string
  duration: string
}

export interface DevelopmentTask {
  text: string
  completed: boolean
}

export interface UserState {
  name: string
  email: string
  role: string
  avatar: string
  profileCompletion: number
  developmentProgress: number
  suggestedCourses: Course[]
  developmentTasks: DevelopmentTask[]
  onboardingCompleted: boolean
  // Personalization fields from onboarding
  education?: string
  university?: string
  major?: string
  graduationYear?: string
  gpa?: string
  interests?: string[]
  skills?: string[]
  experience?: string
  projects?: string
  skillsText?: string
  careerGoals?: string
  // Career track fields
  selectedCareer?: any
  careerRoadmap?: any
  careerMilestones?: any[]
}

const initialState: UserState = {
  name: 'Alex Johnson',
  email: 'alex.johnson@email.com',
  role: 'Aspiring UX Designer',
  avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCLs40vDPssom9DR0mKQ5zOtFD22GVNgcW7d4ctYqrsdeD7hJVAbTJrUMMm66rxS9yQSKfiei8xej--T9JxKwXuW3axmVbe9dKknwxoUNorl4fMdGyZ0BpnrMB-80pIpAC1Bhxo5hyNQctszEGgOg-PEjOKBGl2ChtcZQS_d-QvUvHorq_RjF2nVa7iK9QUSL_Tg_y5VW2PkyC3xxXmvMUYQY68OIyjubUTPw72CGQrN3PfLbyOViF_YXfix1Pb_1c-xlqr3DIhxbPM',
  profileCompletion: 75,
  developmentProgress: 25,
  suggestedCourses: [
    { name: 'Foundations of UX Design', provider: 'Google on Coursera', duration: '2 weeks' },
    { name: 'UI Design Principles', provider: 'Udemy', duration: '4 weeks' },
    { name: 'Prototyping with Figma', provider: 'Skillshare', duration: '3 weeks' }
  ],
  developmentTasks: [
    { text: "Complete 'Foundations of UX' course", completed: true },
    { text: 'Build a portfolio project', completed: false },
    { text: 'Update LinkedIn profile with new skills', completed: false },
    { text: 'Network with 3 UX professionals', completed: false }
  ],
  onboardingCompleted: false,
}

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    updateProfile: (state, action: PayloadAction<Partial<UserState>>) => {
      return { ...state, ...action.payload }
    },
    toggleTask: (state, action: PayloadAction<number>) => {
      const task = state.developmentTasks[action.payload]
      if (task) {
        task.completed = !task.completed
        const completed = state.developmentTasks.filter(t => t.completed).length
        state.developmentProgress = Math.round((completed / state.developmentTasks.length) * 100)
      }
    },
    completeOnboarding: (state) => {
      state.onboardingCompleted = true
    },
    loadUserData: (state, action: PayloadAction<UserState>) => {
      return action.payload
    },
  },
})

export const { updateProfile, toggleTask, completeOnboarding, loadUserData } = userSlice.actions
export default userSlice.reducer

