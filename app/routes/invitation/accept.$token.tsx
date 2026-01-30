import { eq } from 'drizzle-orm'
import { Form, redirect, useNavigation } from 'react-router'
import z from 'zod'
import auth from '~/server/auth-server'
import { db } from '~/server/db'
import {
  invitationModel,
  invitationRoleModel,
  memberModel,
  memberRoleModel,
  userModel,
} from '~/server/db/schemas/auth'
import { acceptInvitationSchema } from '../../features/users/schemas'
import type { Route } from './+types/accept.$token'

export async function loader({ params }: Route.LoaderArgs) {
  const token = params.token

  // Get invitation
  const [inv] = await db
    .select()
    .from(invitationModel)
    .where(eq(invitationModel.id, token))
    .limit(1)

  if (!inv) {
    return { error: 'Invitation not found', invitation: null }
  }

  if (inv.status !== 'pending') {
    return {
      error: 'This invitation has already been used',
      invitation: null,
    }
  }

  if (new Date() > inv.expiresAt) {
    return { error: 'This invitation has expired', invitation: null }
  }

  return { invitation: inv, error: null }
}

export async function action({ params, request }: Route.ActionArgs) {
  const token = params.token
  const formData = await request.formData()

  // Validate input
  const result = acceptInvitationSchema.safeParse({
    name: formData.get('name'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  })

  if (!result.success) {
    const errors = z.flattenError(result.error).fieldErrors
    return {
      error:
        errors.name?.[0] ||
        errors.password?.[0] ||
        errors.confirmPassword?.[0] ||
        'Validation failed',
    }
  }

  const { name, password } = result.data

  try {
    // Get invitation
    const [inv] = await db
      .select()
      .from(invitationModel)
      .where(eq(invitationModel.id, token))
      .limit(1)

    console.log('invitation db...', inv)

    if (!inv || inv.status !== 'pending') {
      return { error: 'Invalid or expired invitation' }
    }

    if (new Date() > inv.expiresAt) {
      return { error: 'This invitation has expired' }
    }

    // Check if user already exists
    const [existingUser] = await db
      .select()
      .from(userModel)
      .where(eq(userModel.email, inv.email))
      .limit(1)

    if (existingUser) {
      // User exists - they need to log in first, then accept invitation
      return {
        error:
          'An account with this email already exists. Please log in to accept the invitation.',
      }
    }

    // Sign up new user with Better Auth using asResponse to get Response object
    const signUpResponse = await auth.api.signUpEmail({
      body: {
        name,
        email: inv.email,
        password,
      },
      asResponse: true,
    })

    // Check if signup was successful
    if (!signUpResponse.ok) {
      const errorData = await signUpResponse.json().catch(() => ({}))
      return {
        error: (errorData as Error)?.message || 'Failed to create user account',
      }
    }

    // Get the newly created user
    const [newUser] = await db
      .select()
      .from(userModel)
      .where(eq(userModel.email, inv.email))
      .limit(1)

    if (!newUser) {
      return { error: 'Failed to create user account' }
    }

    await db
      .update(userModel)
      .set({ emailVerified: true })
      .where(eq(userModel.id, newUser.id))

    console.log('new user db', newUser.id)

    // Get invitation roles from junction table
    const invitationRoles = await db
      .select()
      .from(invitationRoleModel)
      .where(eq(invitationRoleModel.invitationId, token))

    console.log('invitation roles db...', invitationRoles)

    // Manually create member record (since acceptInvitation requires auth)
    const memberId = crypto.randomUUID()
    await db.insert(memberModel).values({
      id: memberId,
      organizationId: inv.organizationId,
      userId: newUser.id,
      role: inv.role,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // Create member roles in junction table (many-to-many)
    if (invitationRoles.length > 0) {
      await db.insert(memberRoleModel).values(
        invitationRoles.map((ir) => ({
          memberId,
          roleId: ir.roleId,
        }))
      )
    }

    // Mark invitation as accepted
    await db
      .update(invitationModel)
      .set({
        status: 'accepted',
        updatedAt: new Date(),
      })
      .where(eq(invitationModel.id, token))

    console.log('invitation is accepted....')

    // Extract session cookies from Better Auth response
    const setCookie = signUpResponse.headers.get('set-cookie')

    console.log('set cookies and redirect ....')
    // Redirect to organization with session cookies
    return redirect('/welcome', {
      headers: setCookie ? { 'set-cookie': setCookie } : {},
    })
  } catch (error) {
    console.error('Error accepting invitation:', error)
    return { error: 'Failed to accept invitation. Please try again.' }
  }
}

export default function AcceptInvitation({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { invitation, error: loaderError } = loaderData
  const actionError = actionData?.error
  const navigation = useNavigation()
  const isLoading = navigation.state === 'submitting'

  if (loaderError || !invitation) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-gray-50 px-4'>
        <div className='w-full max-w-md'>
          <div className='rounded-lg border border-red-200 bg-red-50 p-6 text-center'>
            <h1 className='mb-2 text-xl font-bold text-red-900'>
              Invalid Invitation
            </h1>
            <p className='text-sm text-red-700'>
              {loaderError || 'This invitation is no longer valid.'}
            </p>
            <a
              href='/login'
              className='mt-4 inline-block text-sm text-red-900 underline hover:no-underline'
            >
              Go to Login
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='flex min-h-screen items-center justify-center bg-gray-50 px-4'>
      <div className='w-full max-w-md'>
        <div className='rounded-lg border bg-white p-8 shadow-sm'>
          <h1 className='mb-2 text-2xl font-bold'>Accept Invitation</h1>
          <p className='text-muted-foreground mb-6 text-sm'>
            You&apos;ve been invited to join an organization. Create your
            account to get started.
          </p>

          <div className='mb-6 rounded-lg bg-blue-50 p-4'>
            <p className='text-sm'>
              <span className='font-medium'>Email:</span> {invitation.email}
            </p>
          </div>

          {actionError && (
            <div className='bg-destructive/10 text-destructive mb-4 rounded-md p-3 text-sm'>
              {actionError}
            </div>
          )}

          <Form method='post' className='space-y-4'>
            <div>
              <label htmlFor='name' className='mb-2 block text-sm font-medium'>
                Full Name
              </label>
              <input
                type='text'
                id='name'
                name='name'
                required
                placeholder='John Doe'
                className='border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none'
              />
            </div>

            <div>
              <label
                htmlFor='password'
                className='mb-2 block text-sm font-medium'
              >
                Password
              </label>
              <input
                type='password'
                id='password'
                name='password'
                required
                minLength={8}
                placeholder='At least 8 characters'
                className='border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none'
              />
            </div>

            <div>
              <label
                htmlFor='confirmPassword'
                className='mb-2 block text-sm font-medium'
              >
                Confirm Password
              </label>
              <input
                type='password'
                id='confirmPassword'
                name='confirmPassword'
                required
                minLength={8}
                placeholder='Re-enter your password'
                className='border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none'
              />
            </div>

            <button
              type='submit'
              className='bg-primary text-primary-foreground hover:bg-primary/90 w-full rounded-md px-4 py-2 text-sm font-medium'
              disabled={isLoading}
            >
              {isLoading ? 'Creating the user' : 'Create Account & Join'}
            </button>
          </Form>

          <p className='text-muted-foreground mt-6 text-center text-xs'>
            Already have an account?{' '}
            <a href='/login' className='text-primary hover:underline'>
              Log in
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
