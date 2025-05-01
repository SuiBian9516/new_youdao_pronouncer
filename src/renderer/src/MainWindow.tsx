import {
  Box,
  Button,
  Typography,
  styled,
  IconButton,
  useMediaQuery,
  useTheme as useMuiTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import SettingsIcon from '@mui/icons-material/Settings';
import iconPath from './assets/icon.png';

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
        backdropFilter: 'blur(5px)',
      }}
    >
      {}
      {backgroundUrl && (
        <Typography
          variant="caption"
          sx={{
            position: 'absolute',
            top: 10,
            left: 10,
            color: 'white',
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            padding: '2px 8px',
            borderRadius: '4px',
            backdropFilter: 'blur(10px)',
            fontSize: '0.7rem',
          }}
        >
          图片来自 bing.com
        </Typography>
      )}

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
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
            backgroundColor: 'rgba(255, 255, 255, 0.3)',
            borderRadius: 2,
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
    </Box>
  );
};

export default MainWindow;
