import { useEffect, useState } from 'react';
import { useMsal } from '@azure/msal-react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn } from 'lucide-react';

import { AuthApi, LoginDto, UserApi } from 'api/generated';
import { getConfigurationLogin } from 'confiuration';
import { getAzureApiScope } from 'auth/msalApp';
import { clearAuthSession, persistPasswordSession, persistSsoSession } from 'utils/authSession';
import {
  isReAuthOpen,
  resolveReAuthCancel,
  resolveReAuthSuccess,
  subscribeReAuth,
} from 'utils/reAuthGate';
import { Button } from 'components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from 'components/ui/dialog';
import { cn } from 'lib/utils';
import { useUser } from 'layouts/pages/hooks/userName';

/**
 * Access/refresh bittiğinde sayfayı terk etmeden yeniden giriş.
 * Axios `requestReAuth` ile burayı açar; başarılı girişte bekleyen istekler devam eder.
 */
export default function SessionExpiredModal(): JSX.Element {
  const { instance } = useMsal();
  const navigate = useNavigate();
  const { setuserUserAppDto } = useUser();

  const [open, setOpen] = useState(isReAuthOpen());
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldError, setFieldError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => subscribeReAuth(setOpen), []);

  useEffect(() => {
    if (!open) {
      setEmail('');
      setPassword('');
      setFieldError('');
      setBusy(false);
    }
  }, [open]);

  const finishLogout = (): void => {
    clearAuthSession();
    resolveReAuthCancel();
    navigate('/authentication/sign-in/cover', { replace: true });
  };

  const handleSso = (): void => {
    setBusy(true);
    setFieldError('');
    const scope = getAzureApiScope();

    instance
      .loginPopup({ scopes: [scope] })
      .then(async (response) => {
        const conf = getConfigurationLogin();
        const api = new UserApi(conf);
        const result = await api.apiUserCheckSSOEmailControlGet(response.account.username);

        if (result.data.userName == null) {
          setFieldError('Bu Microsoft hesabı sistemde tanımlı değil.');
          return;
        }

        if (response.account) {
          instance.setActiveAccount(response.account);
        }
        setuserUserAppDto(result.data);
        persistSsoSession(response.accessToken, response.expiresOn?.getTime() ?? null);
        localStorage.setItem(
          'menuNameSurmane',
          `${result.data.firstName} ${result.data.lastName}`
        );
        resolveReAuthSuccess();
      })
      .catch((error: unknown) => {
        const code =
          error && typeof error === 'object' && 'errorCode' in error
            ? String((error as { errorCode?: string }).errorCode)
            : '';
        if (code !== 'user_cancelled' && code !== 'popup_window_error') {
          setFieldError('Microsoft girişi başarısız.');
        }
      })
      .finally(() => setBusy(false));
  };

  const handlePassword = async (): Promise<void> => {
    if (!email.trim() || !password) {
      setFieldError('E-posta ve şifre gerekli.');
      return;
    }

    setBusy(true);
    setFieldError('');

    try {
      const conf = getConfigurationLogin();
      const api = new AuthApi(conf);
      const loginDto: LoginDto = { email: email.trim(), password };
      const result = await api.apiAuthCreateTokenPostCreateTokenPostPost(loginDto);
      const token = result?.data;

      if (!token?.accessToken) {
        throw new Error('token');
      }

      persistPasswordSession({
        accessToken: token.accessToken,
        refreshToken: token.refreshToken,
        accessTokenExpiration: token.accessTokenExpiration,
        refreshTokenExpiration: token.refreshTokenExpiration,
      });
      resolveReAuthSuccess();
    } catch {
      setFieldError('E-posta veya şifre hatalı.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // Overlay ile kapatmayı engelle — yalnızca başarılı giriş veya çıkış
        if (!next && open) return;
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-md gap-5 p-6"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-lg">Oturumunuz sona erdi</DialogTitle>
          <DialogDescription>
            Devam etmek için yeniden giriş yapın. Bulunduğunuz sayfa korunur.
          </DialogDescription>
        </DialogHeader>

        <Button
          type="button"
          variant="outline"
          size="lg"
          disabled={busy}
          className="w-full h-11 gap-2.5 border-slate-200 bg-white text-slate-700"
          onClick={handleSso}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 23 23" className="w-4 h-4 shrink-0">
            <path fill="#f3f3f3" d="M0 0h23v23H0z" />
            <path fill="#f35325" d="M1 1h10v10H1z" />
            <path fill="#81bc06" d="M12 1h10v10H12z" />
            <path fill="#05a6f0" d="M1 12h10v10H1z" />
            <path fill="#ffba08" d="M12 12h10v10H12z" />
          </svg>
          Microsoft ile devam et
        </Button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-100" />
          <span className="text-xs text-slate-400 font-medium">veya e-posta</span>
          <div className="flex-1 h-px bg-slate-100" />
        </div>

        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            void handlePassword();
          }}
        >
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              E-posta
            </label>
            <input
              type="email"
              autoComplete="email"
              value={email}
              disabled={busy}
              onChange={(e) => setEmail(e.target.value)}
              className={cn(
                'w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-slate-800 outline-none',
                'focus:border-slate-400 focus:ring-4 focus:ring-slate-100 border-slate-200'
              )}
              placeholder="ad@vesacons.com"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Şifre
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                disabled={busy}
                onChange={(e) => setPassword(e.target.value)}
                className={cn(
                  'w-full rounded-xl border bg-white px-4 py-2.5 pr-11 text-sm text-slate-800 outline-none',
                  'focus:border-slate-400 focus:ring-4 focus:ring-slate-100 border-slate-200'
                )}
                placeholder="••••••••••"
              />
              <button
                type="button"
                tabIndex={0}
                aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400"
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {fieldError ? (
            <p className="text-xs text-rose-500 font-medium">{fieldError}</p>
          ) : null}

          <Button
            type="submit"
            size="lg"
            disabled={busy}
            className="w-full h-11 bg-[#3e5d8f] hover:bg-[#324d7a] text-white gap-2"
          >
            {busy ? 'Giriş yapılıyor…' : 'Giriş Yap'}
            <LogIn className="w-4 h-4" />
          </Button>
        </form>

        <button
          type="button"
          disabled={busy}
          onClick={finishLogout}
          className="text-xs text-slate-500 hover:text-slate-700 font-medium text-center"
        >
          Farklı hesapla giriş sayfasına git
        </button>
      </DialogContent>
    </Dialog>
  );
}
