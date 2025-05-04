import { styled } from '@mui/material';
import { useCallback } from 'react';
import MinimizeIcon from '@mui/icons-material/Minimize';
import CropSquareIcon from '@mui/icons-material/CropSquare';
import CloseIcon from '@mui/icons-material/Close';
import iconPath from './assets/icon.png';

interface TitleBarContainerProps {
  height: string;
}

const TitleBarContainer = styled('div')<TitleBarContainerProps>(({ height }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  height: height,
  backgroundColor: '#146ccc',
  color: 'white',
  WebkitAppRegion: 'drag',
  width: '100%',
  boxSizing: 'border-box',
  userSelect: 'none',
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  zIndex: 9999,
}));

const TitleText = styled('div')({
  display: 'flex',
  alignItems: 'center',
  paddingLeft: '10px',
  fontSize: '14px',
  fontWeight: 'bold',
});

const AppIcon = styled('img')({
  width: '16px',
  height: '16px',
  marginRight: '8px',
});

const WindowControls = styled('div')({
  display: 'flex',
  WebkitAppRegion: 'no-drag',
});

interface WindowButtonProps {
  height?: string;
}

const WindowButton = styled('button')<WindowButtonProps>(({ height = '32px' }) => ({
  width: '46px',
  height: height,
  border: 'none',
  background: 'transparent',
  color: 'white',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
}));

const CloseButton = styled(WindowButton)({
  '&:hover': {
    backgroundColor: '#e81123',
  },
});

interface TitleBarProps {
  title?: string;
  heightPx?: number;
}

const TitleBar = ({ title = 'YoudaoPronouncer', heightPx = 32 }: TitleBarProps) => {
  const heightString = `${heightPx}px`;

  const handleMinimize = useCallback(async () => {
    await window.api.minimizeWindow();
  }, []);

  const handleMaximize = useCallback(async () => {
    await window.api.maximizeWindow();
  }, []);

  const handleClose = useCallback(async () => {
    await window.api.closeWindow();
  }, []);

  return (
    <TitleBarContainer height={heightString}>
      <TitleText>
        <AppIcon src={iconPath} alt="YoudaoPronouncer" />
        {title}
      </TitleText>
      <WindowControls>
        <WindowButton height={heightString} onClick={handleMinimize}>
          <MinimizeIcon fontSize="small" />
        </WindowButton>
        <WindowButton height={heightString} onClick={handleMaximize}>
          <CropSquareIcon fontSize="small" />
        </WindowButton>
        <CloseButton height={heightString} onClick={handleClose}>
          <CloseIcon fontSize="small" />
        </CloseButton>
      </WindowControls>
    </TitleBarContainer>
  );
};

export default TitleBar;
