'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const { user, loading, signOut } = useAuth()
  const router = useRouter()

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.user-menu-container')) {
        setUserMenuOpen(false)
      }
    }

    if (userMenuOpen) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [userMenuOpen])

  const handleSignOut = async () => {
    setUserMenuOpen(false)
    await signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">⚓</span>
              </div>
              <span className="text-xl font-bold text-gray-900">FloBoats</span>
            </Link>
          </div>

          {/* Navigation Links - Desktop */}
          <nav className="hidden md:flex space-x-8">
            <Link href="/boats-for-sale" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">
              Boats For Sale
            </Link>
            <Link href="/directory" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">
              Directory
            </Link>
            <Link href="/events" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">
              Events
            </Link>
            <Link href="/forums" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">
              Forums
            </Link>
          </nav>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="w-full">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search boats, marinas, events..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Auth Buttons - Desktop */}
          <div className="hidden md:flex items-center space-x-4">
            {loading ? (
              <div className="animate-pulse flex space-x-4">
                <div className="rounded-md bg-gray-200 h-10 w-20"></div>
                <div className="rounded-md bg-gray-200 h-10 w-20"></div>
              </div>
            ) : user ? (
              <div className="relative user-menu-container">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setUserMenuOpen(!userMenuOpen)
                  }}
                  className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 font-medium p-2 rounded-md hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">
                      {user.email?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="hidden sm:block">Account</span>
                  <svg className={`w-4 h-4 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user.email}
                      </p>
                      <p className="text-xs text-gray-500">Signed in</p>
                    </div>

                    {/* Menu Items */}
                    <div className="py-1">
                      <Link 
                        href="/dashboard" 
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <div className="flex items-center">
                          <span className="mr-3">🏠</span>
                          Dashboard
                        </div>
                      </Link>
                      <Link 
                        href="/profile" 
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <div className="flex items-center">
                          <span className="mr-3">👤</span>
                          Profile
                        </div>
                      </Link>
                      <Link 
                        href="/messages" 
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <div className="flex items-center">
                          <span className="mr-3">💬</span>
                          Messages
                        </div>
                      </Link>
                      <Link 
                        href="/boats" 
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <div className="flex items-center">
                          <span className="mr-3">⛵</span>
                          My Boats
                        </div>
                      </Link>
                      <Link 
                        href="/saved" 
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <div className="flex items-center">
                          <span className="mr-3">❤️</span>
                          Saved Boats
                        </div>
                      </Link>
                      <Link 
                        href="/compare" 
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <div className="flex items-center">
                          <span className="mr-3">📊</span>
                          Compare Boats
                        </div>
                      </Link>
                      <Link 
                        href="/listings" 
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <div className="flex items-center">
                          <span className="mr-3">📋</span>
                          My Listings
                        </div>
                      </Link>
                    </div>

                    <hr className="my-1 border-gray-100" />
                    
                    {/* Sign Out */}
                    <button
                      onClick={handleSignOut}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <div className="flex items-center">
                        <span className="mr-3">🚪</span>
                        Sign Out
                      </div>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/login" className="text-gray-600 hover:text-blue-600 font-medium">
                  Sign In
                </Link>
                <Link href="/signup" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-600 hover:text-blue-600 p-2"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 pt-4 pb-3">
            <div className="flex flex-col space-y-3">
              <Link href="/boats-for-sale" className="text-gray-600 hover:text-blue-600 font-medium px-3 py-2">
                Boats For Sale
              </Link>
              <Link href="/directory" className="text-gray-600 hover:text-blue-600 font-medium px-3 py-2">
                Directory
              </Link>
              <Link href="/events" className="text-gray-600 hover:text-blue-600 font-medium px-3 py-2">
                Events
              </Link>
              <Link href="/forums" className="text-gray-600 hover:text-blue-600 font-medium px-3 py-2">
                Forums
              </Link>
              <div className="border-t border-gray-200 pt-3 mt-3">
                {loading ? (
                  <div className="px-3">
                    <div className="animate-pulse space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                      <div className="h-8 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                ) : user ? (
                  <div className="flex flex-col space-y-2 px-3">
                    <div className="text-sm text-gray-600 mb-2">
                      Signed in as: <span className="font-medium">{user.email}</span>
                    </div>
                    <Link href="/dashboard" className="text-gray-600 hover:text-blue-600 font-medium">
                      Dashboard
                    </Link>
                    <Link href="/profile" className="text-gray-600 hover:text-blue-600 font-medium">
                      Profile
                    </Link>
                    <Link href="/messages" className="text-gray-600 hover:text-blue-600 font-medium">
                      Messages
                    </Link>
                    <Link href="/boats" className="text-gray-600 hover:text-blue-600 font-medium">
                      My Boats
                    </Link>
                    <Link href="/saved" className="text-gray-600 hover:text-blue-600 font-medium">
                      Saved Boats
                    </Link>
                    <button 
                      onClick={handleSignOut}
                      className="text-left text-red-600 hover:text-red-700 font-medium"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col space-y-2 px-3">
                    <Link href="/login" className="text-gray-600 hover:text-blue-600 font-medium">
                      Sign In
                    </Link>
                    <Link href="/signup" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-center">
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}