import React from 'react'
import { assets } from '../../assets/assets.js'
import './Navbar.css'
const Navbar = () => {
  return (
    <div className='Navbar'>
        <img className='logo' src={assets.logo} alt="" />
        <img className='profile' src={assets.profile} alt="" />
    </div>
  )
}

export default Navbar