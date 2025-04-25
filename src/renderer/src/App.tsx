import { JSX, useEffect, useState, useCallback } from "react"
import { 
  styled,
  ThemeProvider,
  createTheme,
  Snackbar,
  Alert
} from '@mui/material'
import CreateProjectDialog from './CreateProject'
import ProjectListDialog from './ProjectList'
import SettingsDialog from './Settings'
import ItemEditor from './ItemEditor'
import MainWindow from './MainWindow'

const GlobalStyles = styled('style')({
  '@global': {
    html: {
      margin: 0,
      padding: 0,
      overflow: 'hidden',
      width: '100vw',
      height: '100vh'
    },
    body: {
      margin: 0,
      padding: 0,
      overflow: 'hidden',
      width: '100vw',
      height: '100vh'
    },
    '#root': {
      width: '100%',
      height: '100%',
      position: 'relative',
      overflow: 'hidden'
    }
  }
});

export const customTheme = createTheme({
  palette: {
    primary: {
      main: '#146ccc',
    },
    secondary: {
      main: '#146ccc',
    },
    success: {
      main: '#146ccc',
    },
  },
  typography: {
    fontFamily: '"Segoe UI", "Roboto", "Helvetica", "Arial", sans-serif',
    h3: {
      fontWeight: 600,
      textAlign: 'center',
      color: '#fff',
    },
    h2: {
      fontWeight: 600,
      textAlign: 'center',
      color: '#fff',
    },
    h4: {
      fontWeight: 600,
      textAlign: 'center',
      color: '#fff',
    }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
        },
      },
    },
  },
});

function App(): JSX.Element {
  const [backgroundUrl, setBackgroundUrl] = useState<string>('')
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [projectListDialogOpen, setProjectListDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  
  const [currentView, setCurrentView] = useState<'home' | 'editor'>('home');
  const [currentProject, setCurrentProject] = useState<string | null>(null);
  
  const [alert, setAlert] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });
  
  const showAlert = useCallback((message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setAlert({
      open: true,
      message,
      severity
    });
  }, []);
  
  const openProject = useCallback(async (projectName: string) => {
    try {
      const result = await window.api.openProject(projectName);
      
      if (result.success) {
        setCurrentProject(projectName);
        setCurrentView('editor');
        
        localStorage.setItem('currentProject', projectName);
        
        showAlert(`项目 "${projectName}" 已打开`, 'success');
      } else {
        console.error('打开项目失败:', result.message);
        showAlert(`打开项目失败: ${result.message || '未知错误'}`, 'error');
      }
    } catch (error) {
      console.error('打开项目时发生错误:', error);
      showAlert('打开项目时发生错误', 'error');
    }
  }, [showAlert]);
  
  useEffect(() => {
    const fetchBingWallpaper = async () => {
      try {
        const result = await window.api.fetchBingWallpaper()
        if (result.success && result.imageUrl) {
          setBackgroundUrl(result.imageUrl)
        } else {
          console.error('获取壁纸失败:', result.error)
        }
      } catch (error) {
        console.error('获取壁纸失败:', error)
      }
    }

    fetchBingWallpaper();
  }, []);
  useEffect(() => {
    const savedProject = localStorage.getItem('currentProject');
    if (savedProject) {
      openProject(savedProject);
    }
  }, [openProject]);

  const handleProjectCreated = useCallback((projectName: string) => {
    setCreateDialogOpen(false);
    openProject(projectName);
  }, [openProject]);

  const handleProjectSelected = useCallback((projectName: string) => {
    setProjectListDialogOpen(false);
    openProject(projectName);
  }, [openProject]);

  const handleBackToHome = useCallback(() => {
    setCurrentView('home');
    setCurrentProject(null);
    
    localStorage.removeItem('currentProject');
  }, []);

  return (
    <ThemeProvider theme={customTheme}>
      <GlobalStyles />
      
      {currentView === 'home' ? (
        <MainWindow 
          backgroundUrl={backgroundUrl}
          onCreateProject={() => setCreateDialogOpen(true)}
          onOpenProject={() => setProjectListDialogOpen(true)}
          onOpenSettings={() => setSettingsDialogOpen(true)}
        />
      ) : (
        <ItemEditor 
          onBack={handleBackToHome} 
          projectName={currentProject || '未知项目'} 
        />
      )}

      <CreateProjectDialog 
        open={createDialogOpen} 
        onClose={() => setCreateDialogOpen(false)} 
        onProjectCreated={handleProjectCreated}
      />
      
      <ProjectListDialog
        open={projectListDialogOpen}
        onClose={() => setProjectListDialogOpen(false)}
        onSelectProject={handleProjectSelected}
      />
      
      <SettingsDialog
        open={settingsDialogOpen}
        onClose={() => setSettingsDialogOpen(false)}
      />
      <Snackbar
        open={alert.open}
        autoHideDuration={6000}
        onClose={() => setAlert({ ...alert, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setAlert({ ...alert, open: false })} severity={alert.severity}>
          {alert.message}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  )
}

export default App
