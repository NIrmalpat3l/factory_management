'use client'

import { useActionState, useEffect, useState } from 'react'
import { authenticate, AuthState } from './actions'
import { useRouter } from 'next/navigation'
import { Factory, Mail, Lock, User, Loader2, ArrowRight } from 'lucide-react'

const initialState: AuthState = {
  error: null,
  success: false,
}

export default function LoginPage() {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(authenticate, initialState)
  const [isSignUp, setIsSignUp] = useState(false)

  // Clean redirect with full reload to ensure AuthContext gets the new session
  useEffect(() => {
    if (state?.success) {
      window.location.href = '/'
    }
  }, [state?.success])

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      width: '100vw',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Inter, system-ui, sans-serif',
      background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', // Dark premium background
      position: 'relative',
      overflow: 'hidden'
    }}>
      
      {/* Decorative background shapes */}
      <div style={{
        position: 'absolute',
        top: '-20%',
        left: '-10%',
        width: '60vw',
        height: '60vw',
        background: 'radial-gradient(circle, rgba(217, 56, 58, 0.15) 0%, transparent 60%)',
        borderRadius: '50%',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-20%',
        right: '-10%',
        width: '50vw',
        height: '50vw',
        background: 'radial-gradient(circle, rgba(217, 56, 58, 0.1) 0%, transparent 60%)',
        borderRadius: '50%',
      }} />

      {/* Centered Login Card */}
      <div style={{
        width: '100%',
        maxWidth: '480px',
        margin: '24px',
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '24px',
        padding: '48px',
        position: 'relative',
        zIndex: 1,
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}>
        
        {/* Logo and Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #D9383A 0%, #991b1b 100%)',
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px auto',
            boxShadow: '0 10px 25px -5px rgba(217, 56, 58, 0.4)'
          }}>
            <Factory size={32} color="#ffffff" />
          </div>
          <h1 style={{ 
            fontSize: '32px', 
            fontWeight: 800, 
            color: '#ffffff',
            margin: '0 0 8px 0',
            letterSpacing: '-0.5px'
          }}>
            Factory OS
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '15px', margin: 0 }}>
            {isSignUp ? 'Create your worker account' : 'Sign in to your dashboard'}
          </p>
        </div>

        {state?.error && (
          <div style={{
            background: 'rgba(220, 38, 38, 0.1)',
            color: '#fca5a5',
            padding: '16px',
            borderRadius: '12px',
            border: '1px solid rgba(220, 38, 38, 0.2)',
            marginBottom: '24px',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <Lock size={16} color="#fca5a5" />
            {state.error}
          </div>
        )}

        <form action={formAction}>
          <input type="hidden" name="mode" value={isSignUp ? 'signup' : 'login'} />
          
          {isSignUp && (
            <div style={{ marginBottom: '24px' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '13px', 
                fontWeight: 600, 
                color: '#cbd5e1',
                marginBottom: '8px',
                letterSpacing: '0.5px'
              }}>
                FULL NAME
              </label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required={isSignUp}
                  placeholder="John Doe"
                  style={{
                    width: '100%',
                    padding: '14px 16px 14px 44px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    fontSize: '15px',
                    color: '#ffffff',
                    background: 'rgba(0, 0, 0, 0.2)',
                    transition: 'all 0.2s',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#D9383A'
                    e.target.style.background = 'rgba(0, 0, 0, 0.4)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                    e.target.style.background = 'rgba(0, 0, 0, 0.2)'
                  }}
                />
              </div>
            </div>
          )}

          <div style={{ marginBottom: '24px' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '13px', 
              fontWeight: 600, 
              color: '#cbd5e1',
              marginBottom: '8px',
              letterSpacing: '0.5px'
            }}>
              EMAIL ADDRESS
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="name@company.com"
                style={{
                  width: '100%',
                  padding: '14px 16px 14px 44px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  fontSize: '15px',
                  color: '#ffffff',
                  background: 'rgba(0, 0, 0, 0.2)',
                  transition: 'all 0.2s',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#D9383A'
                  e.target.style.background = 'rgba(0, 0, 0, 0.4)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                  e.target.style.background = 'rgba(0, 0, 0, 0.2)'
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ 
                fontSize: '13px', 
                fontWeight: 600, 
                color: '#cbd5e1',
                letterSpacing: '0.5px'
              }}>
                PASSWORD
              </label>
              {!isSignUp && (
                <a href="#" style={{ fontSize: '13px', color: '#fca5a5', textDecoration: 'none', fontWeight: 500 }}>
                  Forgot password?
                </a>
              )}
            </div>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                required
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '14px 16px 14px 44px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  fontSize: '15px',
                  color: '#ffffff',
                  background: 'rgba(0, 0, 0, 0.2)',
                  transition: 'all 0.2s',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#D9383A'
                  e.target.style.background = 'rgba(0, 0, 0, 0.4)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                  e.target.style.background = 'rgba(0, 0, 0, 0.2)'
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            style={{
              width: '100%',
              background: isPending ? '#fca5a5' : '#D9383A',
              color: 'white',
              padding: '16px',
              borderRadius: '12px',
              border: 'none',
              fontSize: '16px',
              fontWeight: 600,
              cursor: isPending ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s',
              boxShadow: isPending ? 'none' : '0 4px 14px rgba(217, 56, 58, 0.4)',
            }}
            onMouseEnter={(e) => {
              if (!isPending) e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={(e) => {
              if (!isPending) e.currentTarget.style.transform = 'none'
            }}
          >
            {isPending ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                {isSignUp ? 'Creating account...' : 'Signing in...'}
              </>
            ) : (
              <>
                {isSignUp ? 'Sign Up' : 'Sign In'}
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: '32px', textAlign: 'center' }}>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button 
              onClick={() => setIsSignUp(!isSignUp)}
              type="button"
              style={{
                background: 'none',
                border: 'none',
                color: '#fca5a5',
                fontWeight: 600,
                cursor: 'pointer',
                padding: 0,
                fontSize: '14px',
                textDecoration: 'underline'
              }}
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>
        
      </div>
    </div>
  )
}
