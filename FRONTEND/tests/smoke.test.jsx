import { render, screen, waitFor, within, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import App from '@/App';
import { ToastProvider } from '@/context/ToastContext';
import { AuthProvider } from '@/context/AuthContext';

window.print = vi.fn();
URL.createObjectURL = URL.createObjectURL || (() => 'blob:mock');
URL.revokeObjectURL = URL.revokeObjectURL || (() => {});

const errors = [];
const origError = console.error;
console.error = (...a) => { errors.push(a.map(String).join(' ')); };

const T = { timeout: 10000 };
function mount(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <ToastProvider><AuthProvider><App /></AuthProvider></ToastProvider>
    </MemoryRouter>,
  );
}
const side = () => within(screen.getByRole('navigation', { name: 'Main' }));

test('landing, sign in and every app screen', async () => {
  cleanup(); localStorage.clear();
  mount('/');
  const u = userEvent.setup();

  // Landing
  expect(await screen.findByText(/A smarter way to/i, {}, T)).toBeTruthy();
  expect(screen.getByText('School Health Subscription Plans')).toBeTruthy();
  await u.click(within(screen.getByRole('navigation', { name: 'Site' })).getByText('Sign in'));

  // Sign in (wrong password first)
  await u.type(await screen.findByLabelText('Email', {}, T), 'admin1@nectarschools.com');
  await u.type(screen.getByLabelText('Password'), 'wrong-password');
  await u.click(screen.getByRole('button', { name: 'Sign in' }));
  expect(await screen.findByText('Wrong email or password.', {}, T)).toBeTruthy();
  await u.clear(screen.getByLabelText('Password'));
  await u.type(screen.getByLabelText('Password'), 'password123');
  await u.click(screen.getByRole('button', { name: 'Sign in' }));

  // Dashboard
  expect(await screen.findByText('Welcome Back!', {}, T)).toBeTruthy();
  expect(await screen.findByText('Clinic Visits Today', {}, T)).toBeTruthy();
  expect(screen.getByText('Recent Incidents')).toBeTruthy();
  expect(screen.getByText('Health Activity Summary')).toBeTruthy();

  // Activity tracker: record a new activity
  await u.click(side().getByText('Health Activity Tracker'));
  expect(await screen.findByText('Total Activities', {}, T)).toBeTruthy();
  await u.click(screen.getByRole('button', { name: /Record New Activity/ }));
  const dlg = await screen.findByRole('dialog');
  await u.click(within(dlg).getByRole('button', { name: 'Record activity' }));
  expect(await within(dlg).findByText('Give the activity a name.')).toBeTruthy();
  await u.type(within(dlg).getByLabelText(/Activity name/), 'Test Lice Check');
  await u.click(within(dlg).getByRole('button', { name: 'Record activity' }));
  expect(await screen.findByText('Test Lice Check', {}, T)).toBeTruthy();
  await u.click(screen.getByRole('tab', { name: 'Safety Audits' }));
  await waitFor(() => expect(screen.queryByText('Test Lice Check')).toBeNull(), T);

  // Incident report
  await u.click(side().getByText('Injury/ Incident Reporting'));
  await u.type(await screen.findByLabelText('Find student', {}, T), 'Femi');
  await u.click(await screen.findByText('Femi Sanusi', {}, T));
  expect(await screen.findByText('#41325')).toBeTruthy();
  await u.click(screen.getByRole('button', { name: /Submit Report/ }));
  expect(await screen.findByText('Select where it happened.')).toBeTruthy();
  await u.selectOptions(screen.getByDisplayValue('Select location...'), 'Playground');
  await u.type(screen.getByPlaceholderText(/Describe exactly what happened/), 'Fell off the swing and scraped the left knee.');
  await u.click(screen.getByRole('button', { name: 'Ice Pack' }));
  await u.click(screen.getByRole('button', { name: /Submit Report/ }));
  expect(await screen.findByText('Incident Log', {}, T)).toBeTruthy();
  expect((await screen.findAllByText(/^INC-/, {}, T)).length).toBeGreaterThan(3);
  await u.click(screen.getAllByText(/^INC-/)[0]);
  expect(await screen.findByText(/^Report INC-/, {}, T)).toBeTruthy();
  await u.click(screen.getByRole('button', { name: 'Close' }));

  // Reports
  await u.click(side().getByText('Reports & Insights'));
  expect(await screen.findByText('Health Incidents Trend', {}, T)).toBeTruthy();
  expect(screen.getByText('Hygiene Compliance')).toBeTruthy();
  await u.click(screen.getByRole('button', { name: /Export Report/ }));
  await u.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Generate' }));
  expect(await screen.findByText('Report generated.', {}, T)).toBeTruthy();

  // Training
  await u.click(side().getByText(/Training & Resources/));
  expect(await screen.findByText('Core Curriculum', {}, T)).toBeTruthy();
  await u.click(screen.getByRole('button', { name: 'Optional' }));
  await u.click((await screen.findAllByRole('button', { name: 'Start Course' }, T))[0]);
  await u.click(await screen.findByRole('button', { name: 'Mark as complete' }, T));
  expect(await screen.findByText('Course completed. Well done!', {}, T)).toBeTruthy();
  await u.click(screen.getAllByRole('button', { name: 'Close' })[0]);

  // School profile
  await u.click(side().getByText('School Profile'));
  const name = await screen.findByDisplayValue('Nectar Schools', {}, T);
  await u.clear(name); await u.type(name, 'Nectar Schools Lekki');
  await u.click(screen.getByRole('button', { name: /Save Changes/ }));
  expect(await screen.findByText('School profile saved.', {}, T)).toBeTruthy();
  await u.click(screen.getByRole('tab', { name: 'Notifications' }));
  expect(await screen.findByText('Daily Health Reports')).toBeTruthy();
  await u.click(screen.getByRole('tab', { name: 'User Roles' }));
  expect(await screen.findByText('View Only', {}, T)).toBeTruthy();
  expect(await screen.findByText('Busola Alao', {}, T)).toBeTruthy();

  // SereneAI
  await u.click(side().getByText('Serene AI'));
  expect(await screen.findByText(/I am SereneAI School Health Chatbot/, {}, T)).toBeTruthy();
  await u.click(screen.getByRole('button', { name: 'Check Immunization' }));
  expect(await screen.findByText(/share the student ID/, {}, T)).toBeTruthy();
  await u.type(screen.getByLabelText('Message'), 'What is the protocol for a fever?');
  await u.click(screen.getByRole('button', { name: 'Send message' }));
  expect(await screen.findByText('Fever_Protocol_2024.pdf', {}, T)).toBeTruthy();
  await u.click(screen.getByRole('button', { name: /History/ }));
  expect(await screen.findByText('Chat history')).toBeTruthy();
  await u.click(screen.getByRole('button', { name: 'Close' }));

  // Sign out
  await u.click(screen.getByText('Nectar Schools Lekki'));
  await u.click(screen.getByRole('menuitem', { name: /Sign out/ }));
  expect(await screen.findByText(/Welcome to/, {}, T)).toBeTruthy();
});

test('onboarding request form', async () => {
  cleanup(); localStorage.clear();
  mount('/signup?plan=standard');
  const u = userEvent.setup();
  await u.click(await screen.findByRole('button', { name: 'Request onboarding' }, T));
  expect(await screen.findByText('Enter your school’s name.')).toBeTruthy();
  await u.type(screen.getByLabelText(/School name/), 'Test Academy');
  await u.type(screen.getByLabelText(/Contact person/), 'Ada Obi');
  await u.type(screen.getByLabelText(/Phone/), '08031234567');
  await u.type(screen.getByLabelText(/^Email/), 'ada@test.academy');
  await u.type(screen.getByLabelText(/Number of students/), '220');
  await u.click(screen.getByRole('button', { name: 'Request onboarding' }));
  expect(await screen.findByText('Thank you!', {}, T)).toBeTruthy();
});

afterAll(() => {
  console.error = origError;
  const real = errors.filter((e) => !/not wrapped in act|Not implemented/.test(e));
  if (real.length) console.log('CONSOLE ERRORS:\n' + real.join('\n---\n'));
  expect(real).toEqual([]);
});
