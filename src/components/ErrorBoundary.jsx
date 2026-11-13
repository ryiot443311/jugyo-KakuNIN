import { Component } from 'react';
import { getMessages } from '../i18n';
import { SETTINGS_KEY } from '../data/settings';

// App の外側なので、言語は保存された設定から直接読む
const currentMessages = () => {
  try { return getMessages(JSON.parse(localStorage.getItem(SETTINGS_KEY))?.lang); } catch { return getMessages('ja'); }
};

// 描画中のエラーと window の未処理エラーを捕まえ、再読み込みボタン付きの画面を出す
export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidMount() {
    window.addEventListener('error', this.handleWindowError);
  }

  componentWillUnmount() {
    window.removeEventListener('error', this.handleWindowError);
  }

  handleWindowError = (e) => this.setState({ error: e.error || new Error(e.message || currentMessages().unexpectedError) });

  render() {
    if (!this.state.error) return this.props.children;
    const t = currentMessages();
    return (
      <div className="error-screen">
        <h2>{t.errorTitle}</h2>
        <p className="small muted">{this.state.error.message || t.unexpectedError}</p>
        <p className="small muted">{t.dataSafe}</p>
        <button type="button" onClick={() => window.location.reload()} className="btn btn-primary">{t.reload}</button>
      </div>
    );
  }
}
