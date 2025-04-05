import './App.css';
import google_btn_img from './assets/google_btn_img.png'

function navigate(url) {
  window.location.href = url
}

async function auth() {
  const response = await fetch(
    'http://127.0.0.1:5000/api/v1/auth/oauth',
    { method: 'post' })

  const data = await response.json()
  navigate(data.url)
}

function App() {

  return (
    <div id='container'>
      <button type='button' onClick={() => auth()}>
        <img src={google_btn_img} alt='google_auth_button'/>
      </button>
    </div>
  );
}

export default App;
