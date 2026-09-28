'use client';
import { useActionState } from 'react';
import { loginWithCredentials } from './actions';

export function LoginForm() {
  const [state, action, pending] = useActionState(loginWithCredentials, null);

  return (
    <form action={action} className="mt-8 space-y-6">
      <div className="rounded-md shadow-sm -space-y-px">
        <div>
          <label htmlFor="email" className="sr-only">Email address</label>
          <input 
            id="email" 
            name="email" 
            type="email" 
            required 
            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm" 
            placeholder="Email address" 
          />
        </div>
        <div>
          <label htmlFor="password" className="sr-only">Password</label>
          <input 
            id="password" 
            name="password" 
            type="password" 
            required 
            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm" 
            placeholder="Password" 
          />
        </div>
      </div>

      {state?.error && (
        <div className="text-red-600 text-sm font-medium">{state.error}</div>
      )}

      <div>
        <button 
          type="submit" 
          disabled={pending} 
          className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {pending ? 'Signing in...' : 'Sign in'}
        </button>
      </div>
    </form>
  );
}
