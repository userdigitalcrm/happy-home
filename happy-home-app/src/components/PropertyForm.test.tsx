import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PropertyForm from './PropertyForm';

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: {
      user: {
        id: 'user1',
        email: 'test@example.com',
        role: 'ADMIN'
      }
    },
    status: 'authenticated'
  })
}));

// Mock fetch
global.fetch = jest.fn();

describe('PropertyForm', () => {
  const mockCategories = [
    { id: '1', name: 'Квартира', description: null, isActive: true },
    { id: '2', name: 'РИЭЛТОР', description: 'Коммерческая недвижимость', isActive: true }
  ];

  const mockDistricts = [
    { id: 'd1', name: 'Вокзал', description: null, isActive: true }
  ];

  const defaultProps = {
    categories: mockCategories,
    districts: mockDistricts,
    onSave: jest.fn(),
    onCancel: jest.fn()
  };

  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
  });

  test('renders form with Realtor category options', async () => {
    render(<PropertyForm {...defaultProps} />);
    
    // Check that the category select is rendered
    expect(screen.getByLabelText('Категория *')).toBeInTheDocument();
    
    // Select the Realtor category
    const categorySelect = screen.getByLabelText('Категория *') as HTMLSelectElement;
    userEvent.selectOptions(categorySelect, '2');
    
    // Check that the status field uses Realtor-specific options
    const statusField = screen.getByLabelText('Статус *');
    expect(statusField).toBeInTheDocument();
    
    // Click on the status field to open suggestions
    userEvent.click(statusField);
    
    // Check that Realtor-specific status options are available
    expect(screen.getByText('Активен')).toBeInTheDocument();
    expect(screen.getByText('Неактивен')).toBeInTheDocument();
    expect(screen.getByText('Занят')).toBeInTheDocument();
    expect(screen.getByText('Доступен')).toBeInTheDocument();
    expect(screen.getByText('В отпуске')).toBeInTheDocument();
  });

  test('validates required fields for Realtor category', async () => {
    render(<PropertyForm {...defaultProps} />);
    
    // Select the Realtor category
    const categorySelect = screen.getByLabelText('Категория *') as HTMLSelectElement;
    userEvent.selectOptions(categorySelect, '2');
    
    // Try to submit without required fields
    const submitButton = screen.getByText('Сохранить');
    userEvent.click(submitButton);
    
    // Check that validation error is shown
    await waitFor(() => {
      expect(screen.getByText('Для категории "РИЭЛТОР" обязательны только телефон и статус')).toBeInTheDocument();
    });
  });

  test('shows "Имя и Фамилия" label for Realtor category', async () => {
    render(<PropertyForm {...defaultProps} />);
    
    // Select the Realtor category
    const categorySelect = screen.getByLabelText('Категория *') as HTMLSelectElement;
    userEvent.selectOptions(categorySelect, '2');
    
    // Check that the description field label changes to "Имя и Фамилия"
    expect(screen.getByLabelText('Имя и Фамилия')).toBeInTheDocument();
  });
});