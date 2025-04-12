'use client'

import google_btn_img from './assets/google_btn_img.png'
import Image from 'next/image'

function navigate(url: any) {
  window.location.href = url
}

async function auth() {
  const response = await fetch(
    'http://127.0.0.1:5000/api/v1/auth/oauth',
    { method: 'post' })

  const data = await response.json()
  navigate(data.url)
}

export default function Home() {

  return (
    <div className='w-full h-screen flex items-center justify-center'>
      <button className='border-gray-300 rounded-sm border-1 hover:cursor-pointer' type='button' onClick={() => auth()}>
        <Image 
          src={google_btn_img}
          alt='google_auth_button'
        />
      </button>
    </div>
  );

}
