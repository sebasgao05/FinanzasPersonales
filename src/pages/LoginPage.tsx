import { Authenticator, translations } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { I18n } from 'aws-amplify/utils';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

// Generic error message to avoid revealing if email or password is incorrect (Req 1.6)
const GENERIC_AUTH_ERROR = 'La autenticación falló. Verifica tus credenciales e intenta de nuevo.';

// Override Amplify default error messages with generic ones
I18n.putVocabularies(translations);
I18n.setLanguage('es');
I18n.putVocabularies({
  es: {
    'Incorrect username or password.': GENERIC_AUTH_ERROR,
    'User does not exist.': GENERIC_AUTH_ERROR,
    'User is not confirmed.': GENERIC_AUTH_ERROR,
    'Password attempts exceeded': 'Demasiados intentos fallidos. Intenta de nuevo más tarde.',
  },
});

export default function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect to instructions after successful authentication (Req 1.2)
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/instrucciones', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-4">
        <h1 className="text-2xl font-bold text-center mb-6">Finanzas Personales</h1>
        <Authenticator
          hideSignUp={false}
          formFields={{
            signIn: {
              username: {
                label: 'Correo electrónico',
                placeholder: 'Ingresa tu correo electrónico',
              },
              password: {
                label: 'Contraseña',
                placeholder: 'Ingresa tu contraseña',
              },
            },
            signUp: {
              email: {
                label: 'Correo electrónico',
                placeholder: 'Ingresa tu correo electrónico',
              },
              password: {
                label: 'Contraseña',
                placeholder: 'Crea una contraseña',
              },
              confirm_password: {
                label: 'Confirmar contraseña',
                placeholder: 'Confirma tu contraseña',
              },
            },
          }}
        >
          {() => (
            // This block renders after successful auth.
            // Navigation is handled by the useEffect above.
            <></>
          )}
        </Authenticator>
      </div>
    </div>
  );
}
