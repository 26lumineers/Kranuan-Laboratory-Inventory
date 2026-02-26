import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import { IRootState } from '../../store';
import { setPageTitle } from '../../store/themeConfigSlice';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import type { RegisterRequest, RegisterResponse, RegisterRole } from '@laboratory/shared';
import BlankLayout from '@/components/Layouts/BlankLayout';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

type RegisterFormState = RegisterRequest & {
    nickname: string;
    confirmPassword: string;
};

const RegisterBoxed = () => {
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(setPageTitle('Register Boxed'));
    }, [dispatch]);

    useSelector((state: IRootState) => state.themeConfig.theme);

    const [form, setForm] = useState<RegisterFormState>({
        fullName: '',
        nickname: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'GENERAL',
    });
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isPasswordMismatch = useMemo(() => {
        return form.confirmPassword.length > 0 && form.password !== form.confirmPassword;
    }, [form.confirmPassword, form.password]);

    const submitForm = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setErrorMessage(null);
        setSuccessMessage(null);

        if (isPasswordMismatch) {
            setErrorMessage('Password confirmation does not match.');
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch(`${API_BASE_URL}/users/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    fullName: form.fullName,
                    nickname: form.nickname || undefined,
                    email: form.email,
                    password: form.password,
                    role: form.role,
                } satisfies RegisterRequest),
            });

            const payload = (await response.json()) as RegisterResponse;

            if (!response.ok) {
                if (payload?.error === 'EMAIL_ALREADY_REGISTERED') {
                    setErrorMessage('Email is already registered. Please use another email.');
                } else {
                    setErrorMessage('Registration failed. Please try again.');
                }
                return;
            }

            setSuccessMessage('Account created successfully. You can sign in now.');
            setForm({
                fullName: '',
                nickname: '',
                email: '',
                password: '',
                confirmPassword: '',
                role: 'GENERAL',
            });
        } catch (error) {
            setErrorMessage('Unable to connect to server. Please try again later.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-[url('/assets/images/map.svg')] bg-cover bg-center px-4 dark:bg-[url('/assets/images/map-dark.svg')]">
            <div className="panel my-6 w-full max-w-lg">
                <h2 className="mb-3 text-2xl font-bold">Create Account</h2>
                <p className="mb-7 text-sm text-white-dark">Register as General or Admin user.</p>
                <form className="space-y-4" onSubmit={submitForm}>
                    <div>
                        <label htmlFor="fullName">Full Name</label>
                        <input
                            id="fullName"
                            type="text"
                            className="form-input"
                            placeholder="Enter full name"
                            value={form.fullName}
                            onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="nickname">Nickname (Optional)</label>
                        <input
                            id="nickname"
                            type="text"
                            className="form-input"
                            placeholder="Enter nickname"
                            value={form.nickname}
                            onChange={(event) => setForm((prev) => ({ ...prev, nickname: event.target.value }))}
                        />
                    </div>
                    <div>
                        <label htmlFor="role">Role</label>
                        <select id="role" className="form-select" value={form.role} onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value as RegisterRole }))}>
                            <option value="GENERAL">GENERAL</option>
                            <option value="ADMIN">ADMIN</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            className="form-input"
                            placeholder="Enter email"
                            value={form.email}
                            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            className="form-input"
                            placeholder="Minimum 8 characters"
                            minLength={8}
                            value={form.password}
                            onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="confirmPassword">Confirm Password</label>
                        <input
                            id="confirmPassword"
                            type="password"
                            className="form-input"
                            placeholder="Re-enter password"
                            minLength={8}
                            value={form.confirmPassword}
                            onChange={(event) => setForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
                            required
                            aria-invalid={isPasswordMismatch}
                        />
                        {isPasswordMismatch ? <p className="mt-1 text-xs text-danger">Password confirmation does not match.</p> : null}
                    </div>

                    {errorMessage ? <p className="rounded bg-danger-light p-2 text-sm text-danger">{errorMessage}</p> : null}
                    {successMessage ? <p className="rounded bg-success-light p-2 text-sm text-success">{successMessage}</p> : null}

                    <button type="submit" className="btn btn-primary w-full" disabled={isSubmitting || isPasswordMismatch}>
                        {isSubmitting ? 'CREATING ACCOUNT...' : 'SIGN UP'}
                    </button>
                </form>

                <p className="mt-6 text-center text-sm">
                    Already have an account?
                    <Link href="/auth/boxed-signin" className="font-bold text-primary hover:underline ltr:ml-1 rtl:mr-1">
                        Sign In
                    </Link>
                </p>
            </div>
        </div>
    );
};

RegisterBoxed.getLayout = (page: JSX.Element) => {
    return <BlankLayout>{page}</BlankLayout>;
};

export default RegisterBoxed;
