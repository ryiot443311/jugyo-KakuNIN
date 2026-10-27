import { Component } from 'react';

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

  handleWindowError = (e) => this.setState({ error: e.error || new Error(e.message || '予期せぬエラー') });

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="error-screen">
        <h2>エラーが発生しました</h2>
        <p className="small muted">{this.state.error.message || '予期せぬエラー'}</p>
        <p className="small muted">記録やメモは保存されています。</p>
        <button type="button" onClick={() => window.location.reload()} className="btn btn-primary">再読み込み</button>
      </div>
    );
  }
}
