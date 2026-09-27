import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  beginGooglePopup, cancelGooglePopup, clearMessage, googleLogin,
  isCurrentGooglePopup
} from '../../store/slices/authSlice';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const googleLogoUrl = 'https://developers.google.com/static/identity/images/g-logo.png';

const getGoogleScriptStatus = () => {
  if (window.google?.accounts?.oauth2?.initCodeClient) return 'ready';
  return document.getElementById('google-identity-services') ? 'loading' : 'unavailable';
};

const GoogleAuthOption = ({ label, onStart, onPopupError }) => {
  const dispatch = useDispatch();
  const { isLoading, user, token, authRequestId, googleAttemptId } = useSelector(state => state.auth);
  const [scriptStatus, setScriptStatus] = useState(getGoogleScriptStatus);
  const attemptRef = useRef(null);

  useEffect(() => {
    const script = document.getElementById('google-identity-services');
    if (!script) return;

    const onLoad = () => setScriptStatus(
      window.google?.accounts?.oauth2?.initCodeClient ? 'ready' : 'unavailable'
    );
    const onError = () => setScriptStatus('unavailable');
    script.addEventListener('load', onLoad);
    script.addEventListener('error', onError);
    if (window.google?.accounts?.oauth2?.initCodeClient) onLoad();
    const timeout = window.setTimeout(() => {
      if (!window.google?.accounts?.oauth2?.initCodeClient) onError();
    }, 10000);
    return () => {
      window.clearTimeout(timeout);
      script.removeEventListener('load', onLoad);
      script.removeEventListener('error', onError);
    };
  }, []);

  useEffect(() => () => {
    if (attemptRef.current) {
      dispatch(cancelGooglePopup(attemptRef.current.attemptId));
    }
  }, [dispatch]);

  const handleClick = () => {
    if (!googleClientId || scriptStatus !== 'ready' || isLoading ||
        authRequestId || googleAttemptId || user || token) return;

    const attempt = dispatch(beginGooglePopup());
    if (!attempt) return;
    attemptRef.current = attempt;
    onStart();
    dispatch(clearMessage());

    const fail = (message) => {
      if (!dispatch(isCurrentGooglePopup(attempt))) return;
      dispatch(cancelGooglePopup(attempt.attemptId));
      if (attemptRef.current?.attemptId === attempt.attemptId) attemptRef.current = null;
      onPopupError(message);
    };

    try {
      const client = window.google.accounts.oauth2.initCodeClient({
        client_id: googleClientId,
        scope: 'openid email profile',
        include_granted_scopes: false,
        ux_mode: 'popup',
        callback: async (response) => {
          if (!dispatch(isCurrentGooglePopup(attempt))) return;
          if (response?.error || typeof response?.code !== 'string' || !response.code) {
            fail('Google sign-in was cancelled or not approved. Please try again.');
            return;
          }
          await dispatch(googleLogin(response.code, attempt));
          if (attemptRef.current?.attemptId === attempt.attemptId) attemptRef.current = null;
        },
        error_callback: (error) => {
          fail(error?.type === 'popup_closed'
            ? 'Google sign-in was cancelled.'
            : 'Google sign-in could not open. Please enable pop-ups and try again.');
        }
      });
      client.requestCode();
    } catch {
      fail('Google sign-in is unavailable right now. Please try again later.');
    }
  };

  const disabled = !googleClientId || scriptStatus !== 'ready' || isLoading ||
    !!authRequestId || !!googleAttemptId || !!user || !!token;

  return (
    <div>
      <div className="flex items-center gap-4 pb-2.5" aria-hidden="true">
        <span className="h-px flex-1 bg-white/20" />
        <span className="font-label text-xs text-blue-100/65">or</span>
        <span className="h-px flex-1 bg-white/20" />
      </div>
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        aria-busy={!!googleAttemptId}
        className="flex min-h-11 w-full items-center justify-center gap-3 rounded-full border border-white/25 bg-primary/60 px-5 py-2.5 font-label text-sm font-semibold text-white transition-all hover:border-blue-200/50 hover:bg-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300/30 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:bg-primary/60"
      >
        <span className="w-7 h-7 rounded-full bg-white flex items-center justify-center shrink-0" aria-hidden="true">
          <img src={googleLogoUrl} alt="" className="w-5 h-5 object-contain" />
        </span>
        {label}
        {googleAttemptId && (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-transparent" aria-hidden="true" />
        )}
      </button>
      {(!googleClientId || scriptStatus !== 'ready') && (
        <p className="mt-2 text-center font-body text-xs text-blue-100/70" role="status">
          {!googleClientId ? 'Google sign-in is not configured' :
            scriptStatus === 'loading' ? 'Loading Google sign-in...' : 'Google sign-in is unavailable right now'}
        </p>
      )}
    </div>
  );
};

export default GoogleAuthOption;
