import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  IconButton,
  ThemeProvider,
  Snackbar,
  Alert,
  Stack,
  InputAdornment,
  CircularProgress
} from '@mui/material';
import { customTheme } from './App';
import CloseIcon from '@mui/icons-material/Close';
import FolderIcon from '@mui/icons-material/Folder';
import * as path from 'path';

interface CreateProjectDialogProps {
  open: boolean;
  onClose: () => void;
  onProjectCreated: (projectName: string) => void;
}

export default function CreateProjectDialog({ open, onClose, onProjectCreated }: CreateProjectDialogProps) {
  const [projectName, setProjectName] = useState('');
  const [projectPath, setProjectPath] = useState('');
  const [nameError, setNameError] = useState('');
  const [pathError, setPathError] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isLoadingPath, setIsLoadingPath] = useState(false);
  const [alert, setAlert] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    if (open) {
      const loadDefaultPath = async () => {
        try {
          setIsLoadingPath(true);
          const defaultPath = await window.api.getDefaultProjectPath();
          setProjectPath(defaultPath);
          setPathError('');
        } catch (error) {
          console.error('获取默认项目路径失败:', error);
        } finally {
          setIsLoadingPath(false);
        }
      };

      if (!projectPath) {
        loadDefaultPath();
      }
    }
  }, [open, projectPath]);

  const handleCloseAlert = () => {
    setAlert({ ...alert, open: false });
  };

  const handleProjectNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setProjectName(value);

    if (!value) {
      setNameError('项目名称不能为空');
    } else if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(value)) {
      setNameError('项目名称只能包含字母、数字、下划线和中文');
    } else {
      setNameError('');
    }
  };

  const handleProjectPathChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setProjectPath(value);

    if (!value) {
      setPathError('项目路径不能为空');
    } else {
      setPathError('');
    }
  };

  const handleSelectFolder = async () => {
    try {
      const result = await window.api.selectFolder();
      
      if (result && result.canceled === false && result.filePaths.length > 0) {
        setProjectPath(result.filePaths[0]);
        setPathError('');
      }
    } catch (error) {
      console.error('选择文件夹失败:', error);
      setAlert({
        open: true,
        message: '选择文件夹失败',
        severity: 'error'
      });
    }
  };

  const handleCreateProject = async () => {
    if (!projectName) {
      setNameError('项目名称不能为空');
      return;
    }
    if (!projectPath) {
      setPathError('项目路径不能为空');
      return;
    }

    let finalPath = projectPath;
    try {
      const defaultPath = await window.api.getDefaultProjectPath();
      if (projectPath === defaultPath) {
        finalPath = path.join(defaultPath, projectName);
      }
    } catch (error) {
      console.error('获取默认路径失败:', error);
    }

    try {
      setIsCreating(true);

      const result = await window.api.createProject({
        name: projectName,
        path: finalPath
      });

      if (result.success) {
        setAlert({
          open: true,
          message: `项目 "${projectName}" 创建成功`,
          severity: 'success'
        });
        
        setProjectName('');
        setProjectPath('');
        
        onProjectCreated(projectName);
        
        onClose();
      } else {
        setAlert({
          open: true,
          message: result.message || '创建项目失败',
          severity: 'error'
        });
      }
    } catch (error) {
      console.error('创建项目失败:', error);
      setAlert({
        open: true,
        message: '创建项目时发生错误',
        severity: 'error'
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDialogClose = () => {
    setProjectName('');
    setProjectPath('');
    setNameError('');
    setPathError('');
    onClose();
  };

  return (
    <ThemeProvider theme={customTheme}>
      <Dialog
        open={open}
        onClose={handleDialogClose}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h5">新建项目</Typography>
            <IconButton edge="end" onClick={handleDialogClose} aria-label="close">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="项目名称"
              value={projectName}
              onChange={handleProjectNameChange}
              error={!!nameError}
              helperText={nameError || "输入项目的名称，例如：English Words Learning"}
              fullWidth
              variant="outlined"
              autoFocus
              required
            />
            
            <TextField
              label="项目路径"
              value={projectPath}
              onChange={handleProjectPathChange}
              error={!!pathError}
              helperText={pathError || "选择项目文件保存的位置"}
              fullWidth
              variant="outlined"
              required
              disabled={isLoadingPath}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    {isLoadingPath ? (
                      <CircularProgress size={24} />
                    ) : (
                      <IconButton onClick={handleSelectFolder} edge="end">
                        <FolderIcon />
                      </IconButton>
                    )}
                  </InputAdornment>
                ),
              }}
            />
            
            <Box mt={2}>
              <Typography variant="body2" color="text.secondary">
                创建项目后，您可以添加单词、短语，生成视频。
              </Typography>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} color="inherit">
            取消
          </Button>
          <Button
            onClick={handleCreateProject}
            color="primary"
            variant="contained"
            disabled={isCreating || !!nameError || !!pathError || !projectName || !projectPath || isLoadingPath}
          >
            {isCreating ? '创建中...' : '创建项目'}
          </Button>
        </DialogActions>
      </Dialog>
      
      <Snackbar
        open={alert.open}
        autoHideDuration={6000}
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseAlert} severity={alert.severity}>
          {alert.message}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}