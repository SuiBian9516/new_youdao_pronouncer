import {
  Box,
  Button,
  Typography,
  styled,
  IconButton,
  useMediaQuery,
  useTheme as useMuiTheme,
  Fade,
  GlobalStyles,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import SettingsIcon from '@mui/icons-material/Settings';
import iconPath from './assets/icon.png';
import { useState, useEffect } from 'react';

interface JinrishiciData {
  id: string;
  content: string;
  popularity: number;
  origin: {
    title: string;
    dynasty: string;
    author: string;
    content: string[];
    translate: string[];
  };
  matchTags: string[];
  recommendedReason: string;
  cacheAt: string;
}

interface MainWindowProps {
  onCreateProject: () => void;
  onOpenProject: () => void;
  onOpenSettings: () => void;
  backgroundUrl: string;
}

const MainWindow = ({
  onCreateProject,
  onOpenProject,
  onOpenSettings,
  backgroundUrl,
}: MainWindowProps) => {
  const theme = useMuiTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const isMediumScreen = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  const [dailyPoem, setDailyPoem] = useState<JinrishiciData | null>(null);
  const [, setPoemLoading] = useState<boolean>(false);
  const [showZenMode, setShowZenMode] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [showMainContent, setShowMainContent] = useState<boolean>(true);

  const [blurIntensity, setBlurIntensity] = useState<number>(3);

  const [zenBlurActive, setZenBlurActive] = useState<boolean>(false);

  useEffect(() => {
    const fetchDailyPoem = async () => {
      setPoemLoading(true);

      try {
        const response = await fetch('https://v2.jinrishici.com/one.json');
        const data = await response.json();
        if (data && data.status === 'success') {
          setDailyPoem(data.data);
        }
      } catch (error) {
        console.error('获取每日诗词失败:', error);
      } finally {
        setPoemLoading(false);
      }
    };

    fetchDailyPoem();
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}`);
    };

    updateTime();
    const timeInterval = setInterval(updateTime, 1000);

    return () => clearInterval(timeInterval);
  }, []);

  const toggleZenMode = () => {
    if (!showZenMode) {
      const zenElements = document.querySelectorAll('.zen-element');
      zenElements.forEach(el => {
        (el as HTMLElement).style.animation = '';
      });

      setBlurIntensity(0);
      setShowMainContent(false);

      setTimeout(() => {
        setShowZenMode(true);

        setTimeout(() => {
          setZenBlurActive(true);
        }, 100);
      }, 400);
    } else {
      setZenBlurActive(false);

      setTimeout(() => {
        const zenElements = document.querySelectorAll('.zen-element');
        zenElements.forEach(el => {
          (el as HTMLElement).style.animation = 'fadeOut 0.5s forwards';
        });

        setTimeout(() => {
          setShowZenMode(false);
          setShowMainContent(true);

          setTimeout(() => {
            setBlurIntensity(3);
          }, 400);
        }, 500);
      }, 400);
    }
  };

  const globalStyles = (
    <GlobalStyles
      styles={{
        '@keyframes fadeOut': {
          from: {
            opacity: 1,
            transform: 'translateY(0)',
          },
          to: {
            opacity: 0,
            transform: 'translateY(20px)',
          },
        },
        '@keyframes blurIn': {
          from: {
            backdropFilter: 'blur(0px)',
            WebkitBackdropFilter: 'blur(0px)',
          },
          to: {
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          },
        },
        '@keyframes blurOut': {
          from: {
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          },
          to: {
            backdropFilter: 'blur(0px)',
            WebkitBackdropFilter: 'blur(0px)',
          },
        },
      }}
    />
  );

  const titleVariant = isSmallScreen ? 'h4' : isMediumScreen ? 'h3' : 'h2';
  const iconSize = isSmallScreen ? 80 : isMediumScreen ? 100 : 120;
  const buttonSize = isSmallScreen ? 150 : 180;
  const buttonIconSize = isSmallScreen ? 40 : 50;

  const DynamicStyledButton = styled(Button)(() => ({
    margin: '15px',
    padding: '0px',
    fontSize: isSmallScreen ? '14px' : '16px',
    width: `${buttonSize}px`,
    height: `${buttonSize}px`,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)',
    borderRadius: '12px',
    color: 'white',
  }));

  return (
    <>
      {globalStyles}
      <Box
        sx={{
          height: '100vh',
          width: '100vw',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundImage: backgroundUrl ? `url(${backgroundUrl})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundColor: backgroundUrl ? 'transparent' : '#f5f5f5',
          overflow: 'hidden',
          position: 'fixed',
          top: 0,
          left: 0,

          backdropFilter: `blur(${blurIntensity}px)`,
          WebkitBackdropFilter: `blur(${blurIntensity}px)`,
          transition:
            'backdrop-filter 0.8s ease, -webkit-backdrop-filter 0.8s ease, background-color 0.8s ease',
        }}
        onClick={() => showZenMode && toggleZenMode()}
      >
        {}
        {showZenMode && (
          <Box
            className="zen-blur-overlay"
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100%',
              height: '100%',
              zIndex: 1000,
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              backgroundColor: 'rgba(0, 0, 0, 0.05)',
              animation: zenBlurActive ? 'blurIn 0.8s forwards' : 'none',
              opacity: zenBlurActive ? 1 : 0,
              transition: 'opacity 0.8s ease',
            }}
          />
        )}

        {}
        <Box
          sx={{
            display: showZenMode ? 'flex' : 'none',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100%',
            height: '100%',
            zIndex: 1100,
          }}
        >
          <Typography
            className="zen-element"
            variant="h1"
            sx={{
              fontSize: isSmallScreen ? '6rem' : '9rem',
              fontWeight: 700,
              color: 'white',
              marginBottom: 2,
              textShadow: '2px 2px 8px rgba(0, 0, 0, 0.5)',

              animation: showZenMode ? 'fadeIn 0.5s ease forwards' : 'none',
              opacity: 0,
              '@keyframes fadeIn': {
                to: { opacity: 1 },
              },
            }}
          >
            {currentTime}
          </Typography>

          {dailyPoem && (
            <Box
              className="zen-element"
              sx={{
                textAlign: 'center',
                maxWidth: '80%',
                padding: 2,

                animation: showZenMode ? 'fadeIn 1s ease 0.3s forwards' : 'none',
                opacity: 0,
                '@keyframes fadeIn': {
                  from: {
                    opacity: 0,
                    transform: 'translateY(20px)',
                  },
                  to: {
                    opacity: 1,
                    transform: 'translateY(0)',
                  },
                },
              }}
            >
              <Typography
                variant="h5"
                sx={{
                  color: 'white',
                  textShadow: '1px 1px 4px rgba(0, 0, 0, 0.8)',
                  marginBottom: 1,
                  lineHeight: 1.6,
                }}
              >
                {dailyPoem.content}
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: 'rgba(255, 255, 255, 0.8)',
                  textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)',
                }}
              >
                —— {dailyPoem.origin.title}
              </Typography>
            </Box>
          )}
        </Box>

        <Fade in={showMainContent && !showZenMode} timeout={800}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '100%',
              opacity: showMainContent ? 1 : 0,
              transition: 'opacity 0.4s ease',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                marginBottom: isSmallScreen ? 4 : 8,
                width: 'auto',
                maxWidth: '90%',
                padding: isSmallScreen ? '15px 25px' : '20px 40px',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                backgroundColor: 'rgba(255, 255, 255, 0.3)',
                borderRadius: 2,
                cursor: 'pointer',
              }}
              onClick={e => {
                e.stopPropagation();
                toggleZenMode();
              }}
            >
              <Box
                component="img"
                src={iconPath}
                alt="YoudaoPronouncer"
                sx={{
                  height: iconSize,
                  width: iconSize,
                  marginBottom: isSmallScreen ? 1 : 3,
                }}
              />
              <Typography
                variant={titleVariant}
                component="h1"
                sx={{
                  fontWeight: 'bold',
                  color: '#ffffff',
                  textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
                }}
              >
                YoudaoPronouncer
              </Typography>
            </Box>
            <Box
              sx={{
                display: 'flex',
                flexDirection: isSmallScreen ? 'column' : 'row',
                justifyContent: 'center',
                gap: isSmallScreen ? '10px' : '20px',
                flexWrap: 'wrap',
                width: '100%',
              }}
            >
              <DynamicStyledButton
                variant="contained"
                color="primary"
                style={{ backgroundColor: '#146ccc' }}
                onClick={onCreateProject}
              >
                <AddIcon sx={{ fontSize: buttonIconSize, marginBottom: isSmallScreen ? 1 : 2 }} />
                新建项目
              </DynamicStyledButton>
              <DynamicStyledButton
                variant="contained"
                color="primary"
                style={{ backgroundColor: '#146ccc' }}
                onClick={onOpenProject}
              >
                <FolderOpenIcon
                  sx={{ fontSize: buttonIconSize, marginBottom: isSmallScreen ? 1 : 2 }}
                />
                打开项目
              </DynamicStyledButton>
            </Box>
          </Box>
        </Fade>

        <Fade in={showMainContent && !showZenMode} timeout={800}>
          <IconButton
            sx={{
              position: 'absolute',
              bottom: 20,
              right: 20,
              backgroundColor: 'transparent',
              color: 'white',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
              width: isSmallScreen ? 40 : 50,
              height: isSmallScreen ? 40 : 50,
            }}
            onClick={onOpenSettings}
          >
            <SettingsIcon fontSize={isSmallScreen ? 'medium' : 'large'} />
          </IconButton>
        </Fade>
      </Box>
    </>
  );
};

export default MainWindow;
