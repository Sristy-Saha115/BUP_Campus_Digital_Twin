
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import PageHero from '../components/PageHero.jsx';
import Alert from '../components/Alert.jsx';

import { useLang } from '../i18n.jsx';
import { useAuth } from '../auth.jsx';
import { api } from '../api';

// Provisional Student ID length: 8 to 12 digits
const STUDENT_ID_REGEX = /^\d{8,12}$/;

const EMPTY_FORM = {
  name: '',
  role: '',
  studentId: '',
  email: '',
  password: '',
  facultyId: '',
  code: ''
};

export default function Login() {
  const { t } = useLang();
  const { authenticate } = useAuth();
  const nav = useNavigate();

  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const [facultyList, setFacultyList] = useState([]);
  const [codeRequired, setCodeRequired] = useState(false);

  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const isRegister = mode === 'register';
  const isStudent = isRegister && form.role === 'Student';
  const isFaculty = isRegister && form.role === 'Faculty';
  const isAdmin = isRegister && form.role === 'Admin';

  // Update form values
  const set = (key) => (e) => {
    setForm((prev) => ({
      ...prev,
      [key]: e.target.value
    }));
  };

  // Reset role-specific fields when role changes
  const changeRole = (e) => {
    const selectedRole = e.target.value;

    setForm((prev) => ({
      ...prev,
      role: selectedRole,
      studentId: '',
      email: '',
      password: '',
      facultyId: '',
      code: ''
    }));

    setMsg(null);
    setCodeRequired(false);
    setFacultyList([]);
  };

  // Load Faculty profiles
  useEffect(() => {
    if (!isFaculty) return;

    let cancelled = false;

    api('/auth/faculty-options')
      .then((data) => {
        if (cancelled) return;

        setFacultyList(data.faculty || []);
        setCodeRequired(Boolean(data.codeRequired));
      })
      .catch((err) => {
        if (cancelled) return;

        setMsg({
          type: 'danger',
          text: err.message
        });
      });

    return () => {
      cancelled = true;
    };
  }, [isFaculty]);

  // Login or Registration
  const submit = async (e) => {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    try {
      const email = form.email.trim().toLowerCase();

      // =====================================
      // STUDENT REGISTRATION
      // =====================================
      if (isStudent) {
        const studentId = form.studentId.trim();
        const name = form.name.trim();

        if (!STUDENT_ID_REGEX.test(studentId)) {
          setMsg({
            type: 'danger',
            text:
              'Student ID must contain 8 to 12 digits.'
          });
          return;
        }

        const expectedEmail =
          `${studentId}@student.bup.edu.bd`;

        if (email !== expectedEmail) {
          setMsg({
            type: 'danger',
            text:
              'BUP Student Email must match your Student ID. ' +
              `Expected: ${expectedEmail}`
          });
          return;
        }

        if (!name) {
          setMsg({
            type: 'danger',
            text: 'Full name is required.'
          });
          return;
        }

        // Backend creates a Pending Student.
        // No authentication token is returned.
        const result = await api('/auth/register', {
          method: 'POST',
          body: {
            name,
            studentId,
            email,
            password: form.password
          }
        });

        if (!result.pendingApproval) {
          throw new Error(
            'Registration did not return the expected approval status.'
          );
        }

        setMode('login');

        setForm({
          ...EMPTY_FORM,
          email
        });

        setMsg({
          type: 'success',
          text:
            'Registration submitted successfully. ' +
            'Your account is pending Admin approval. ' +
            'You can log in after approval.'
        });

        return;
      }

      // =====================================
      // FACULTY REGISTRATION
      // =====================================
      if (isFaculty) {
        const user = await authenticate(
          'register-faculty',
          {
            name: form.name.trim(),
            email,
            password: form.password,
            facultyId: form.facultyId,
            code: form.code
          }
        );

        if (user?.role !== 'Faculty') {
          throw new Error(
            'Unexpected account role.'
          );
        }

        nav('/faculty', { replace: true });
        return;
      }

      // =====================================
      // FIXED ADMIN LOGIN
      // =====================================
      if (isAdmin) {
        const user = await authenticate(
          'admin-login',
          {
            email,
            password: form.password
          }
        );

        if (user?.role !== 'Admin') {
          throw new Error(
            'Invalid Admin account.'
          );
        }

        nav('/admin', { replace: true });
        return;
      }

      // =====================================
      // NORMAL LOGIN
      // =====================================
      if (!isRegister) {
        const user = await authenticate(
          'login',
          {
            email,
            password: form.password
          }
        );

        // Backend determines the actual role
        if (user?.role === 'Admin') {
          nav('/admin', { replace: true });
        } else if (user?.role === 'Faculty') {
          nav('/faculty', { replace: true });
        } else if (user?.role === 'Student') {
          nav('/', { replace: true });
        } else {
          throw new Error(
            'This account role is not allowed to log in.'
          );
        }

        return;
      }

      setMsg({
        type: 'danger',
        text: 'Please select your role.'
      });

    } catch (err) {
      setMsg({
        type: 'danger',
        text: err.message || 'Authentication failed.'
      });

    } finally {
      setLoading(false);
    }
  };

  // Switch Login / Register
  const changeMode = () => {
    setMode((prev) =>
      prev === 'login' ? 'register' : 'login'
    );

    setForm({ ...EMPTY_FORM });
    setFacultyList([]);
    setCodeRequired(false);
    setMsg(null);
  };

  return (
    <>
      <PageHero
        icon="fa-user-shield"
        title={
          mode === 'login'
            ? t('auth.login')
            : t('auth.register')
        }
      />

      <div
        className="container py-4"
        style={{ maxWidth: 480 }}
      >
        <div className="panel">

          <form onSubmit={submit}>

            {/* =====================================
                REGISTRATION: FULL NAME
                ===================================== */}

            {isRegister && !isAdmin && (
              <>
                <label className="form-label">
                  {t('auth.name')}
                </label>

                <input
                  type="text"
                  className="form-control mb-3"
                  placeholder="Enter your full name"
                  value={form.name}
                  onChange={set('name')}
                  maxLength={100}
                  required
                  disabled={loading}
                />
              </>
            )}

            {/* =====================================
                REGISTRATION: ROLE
                ===================================== */}

            {isRegister && (
              <>
                <label className="form-label">
                  {t('auth.role')}
                </label>

                <select
                  className="form-select mb-3"
                  value={form.role}
                  onChange={changeRole}
                  required
                  disabled={loading}
                >
                  <option value="">
                    Select your role
                  </option>

                  <option value="Student">
                    Student
                  </option>

                  <option value="Faculty">
                    Faculty
                  </option>

                  <option value="Admin">
                    Admin
                  </option>
                </select>
              </>
            )}

            {/* =====================================
                STUDENT-SPECIFIC FIELDS
                ===================================== */}

            {isStudent && (
              <>
                <label className="form-label">
                  Student ID
                </label>

                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{8,12}"
                  minLength={8}
                  maxLength={12}
                  title="Enter an 8 to 12 digit Student ID"
                  className="form-control mb-3"
                  placeholder="e.g. 24549010115"
                  value={form.studentId}
                  onChange={set('studentId')}
                  required
                  disabled={loading}
                />

                <label className="form-label">
                  BUP Student Email
                </label>

                <input
                  type="email"
                  className="form-control mb-3"
                  placeholder="studentID@student.bup.edu.bd"
                  value={form.email}
                  onChange={set('email')}
                  maxLength={254}
                  autoComplete="email"
                  required
                  disabled={loading}
                />

                <label className="form-label">
                  {t('auth.password')}
                </label>

                <input
                  type="password"
                  className="form-control mb-3"
                  placeholder="Create a password"
                  value={form.password}
                  onChange={set('password')}
                  minLength={8}
                  maxLength={72}
                  autoComplete="new-password"
                  required
                  disabled={loading}
                />

                <div className="alert alert-info py-2">
                  Your Student ID must match your BUP email.
                  Your registration requires Admin approval
                  before login.
                </div>
              </>
            )}

            {/* =====================================
                FACULTY-SPECIFIC FIELDS
                ===================================== */}

            {isFaculty && (
              <>
                <label className="form-label">
                  Official Faculty Email
                </label>

                <input
                  type="email"
                  className="form-control mb-3"
                  placeholder="name@bup.edu.bd"
                  value={form.email}
                  onChange={set('email')}
                  maxLength={254}
                  autoComplete="email"
                  required
                  disabled={loading}
                />

                <label className="form-label">
                  {t('auth.password')}
                </label>

                <input
                  type="password"
                  className="form-control mb-3"
                  placeholder="Create a password"
                  value={form.password}
                  onChange={set('password')}
                  minLength={8}
                  maxLength={72}
                  autoComplete="new-password"
                  required
                  disabled={loading}
                />

                <label className="form-label">
                  {t('auth.facultyProfile')}
                </label>

                <select
                  className="form-select mb-3"
                  value={form.facultyId}
                  onChange={set('facultyId')}
                  required
                  disabled={loading}
                >
                  <option value="">
                    {t('fac.choose')}
                  </option>

                  {facultyList.map((faculty) => (
                    <option
                      key={faculty._id}
                      value={faculty._id}
                    >
                      {faculty.name}
                      {' ('}
                      {String(faculty.department || '')
                        .split('\u2014')
                        .pop()
                        .trim()}
                      {')'}
                    </option>
                  ))}
                </select>

                {codeRequired && (
                  <>
                    <label className="form-label">
                      {t('auth.facultyCode')}
                    </label>

                    <input
                      type="text"
                      className="form-control mb-3"
                      placeholder="Enter Faculty Access Code"
                      value={form.code}
                      onChange={set('code')}
                      required
                      disabled={loading}
                    />
                  </>
                )}
              </>
            )}

            {/* =====================================
                ADMIN-SPECIFIC FIELDS
                ===================================== */}

            {isAdmin && (
              <>
                <div className="alert alert-info py-2">
                  Admin registration is disabled.
                  Use the fixed Admin credentials to log in.
                </div>

                <label className="form-label">
                  Admin Email
                </label>

                <input
                  type="email"
                  className="form-control mb-3"
                  placeholder="Enter Admin email"
                  value={form.email}
                  onChange={set('email')}
                  autoComplete="username"
                  required
                  disabled={loading}
                />

                <label className="form-label">
                  {t('auth.password')}
                </label>

                <input
                  type="password"
                  className="form-control mb-3"
                  placeholder="Enter Admin password"
                  value={form.password}
                  onChange={set('password')}
                  autoComplete="current-password"
                  minLength={8}
                  maxLength={72}
                  required
                  disabled={loading}
                />
              </>
            )}

            {/* =====================================
                NORMAL LOGIN FIELDS
                ===================================== */}

            {!isRegister && (
              <>
                <label className="form-label">
                  {t('auth.email')}
                </label>

                <input
                  type="email"
                  className="form-control mb-3"
                  placeholder="Enter email address"
                  value={form.email}
                  onChange={set('email')}
                  autoComplete="username"
                  required
                  disabled={loading}
                />

                <label className="form-label">
                  {t('auth.password')}
                </label>

                <input
                  type="password"
                  className="form-control mb-3"
                  placeholder="Enter password"
                  value={form.password}
                  onChange={set('password')}
                  autoComplete="current-password"
                  minLength={8}
                  maxLength={72}
                  required
                  disabled={loading}
                />
              </>
            )}

            {/* =====================================
                SUBMIT BUTTON
                ===================================== */}

            <button
              type="submit"
              className="btn btn-gold w-100 fw-bold"
              disabled={loading}
            >
              {loading
                ? 'Please wait...'
                : !isRegister || isAdmin
                  ? t('auth.login')
                  : t('auth.register')}
            </button>

          </form>

          {/* Success / Error message */}
          <Alert msg={msg} />

          {/* Switch Login / Registration */}
          <button
            type="button"
            className="btn btn-link mt-2 p-0"
            onClick={changeMode}
            disabled={loading}
          >
            {mode === 'login'
              ? t('auth.noAccount')
              : t('auth.haveAccount')}
          </button>

        </div>
      </div>
    </>
  );
}
