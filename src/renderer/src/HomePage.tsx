import React from 'react'
import { Box, Button, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'

const HomePage: React.FC = () => {
  const navigate = useNavigate()

  return (
    <Box
      sx={{
        background: 'linear-gradient(135deg, #f0f8ff, #e6f7ff)',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Poppins, sans-serif',
        padding: '20px'
      }}
    >
      {/* Logo 和标题 */}
      <Box sx={{ textAlign: 'center', marginBottom: '40px' }}>
        <Box
          sx={{
            width: '100px',
            height: '100px',
            backgroundColor: '#d9d9d9',
            borderRadius: '50%',
            margin: '0 auto',
            marginBottom: '20px'
          }}
        />
        <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#1890ff' }}>
          Youdao Pronouncer
        </Typography>
      </Box>

      {/* 按钮组 */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', maxWidth: '300px' }}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate('/edit')}
          sx={{ borderRadius: '5px', padding: '10px', fontSize: '16px' }}
        >
          快速开始
        </Button>
        <Button
          variant="outlined"
          color="primary"
          sx={{ borderRadius: '5px', padding: '10px', fontSize: '16px' }}
        >
          创建项目
        </Button>
        <Button
          variant="outlined"
          color="primary"
          sx={{ borderRadius: '5px', padding: '10px', fontSize: '16px' }}
        >
          打开项目
        </Button>
      </Box>
    </Box>
  )
}

export default HomePage
