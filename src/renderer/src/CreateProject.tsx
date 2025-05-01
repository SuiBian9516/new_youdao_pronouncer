import { useState, useEffect, useRef } from 'react';
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
  CircularProgress,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Divider,
} from '@mui/material';
import { customTheme } from './App';
import CloseIcon from '@mui/icons-material/Close';
import FolderIcon from '@mui/icons-material/Folder';
import * as path from 'path';

interface ProjectManifest {
  name: string;
  backgroundColor: string;
  characterColor: [string, string];
  title: string;
  subtitle: string;
}

interface CreateProjectDialogProps {
  open: boolean;
  onClose: () => void;
  onProjectCreated: (projectName: string) => void;
}

export default function CreateProjectDialog({
  open,
  onClose,
  onProjectCreated,
}: CreateProjectDialogProps) {
  const [activeTab, setActiveTab] = useState(0);
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
    severity: 'success',
  });

  const [projectTitle, setProjectTitle] = useState('');
  const [projectSubtitle, setProjectSubtitle] = useState('');

  const backgroundColorRef = useRef<HTMLInputElement>(null);
  const textColor1Ref = useRef<HTMLInputElement>(null);
  const textColor2Ref = useRef<HTMLInputElement>(null);

  const [backgroundColor, setBackgroundColor] = useState('#000000');
  const [textColor1, setTextColor1] = useState('#FFFFFF');
  const [textColor2, setTextColor2] = useState('#E0C410');

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

  const handleBackgroundColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBackgroundColor(e.target.value);
  };

  const handleTextColor1Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTextColor1(e.target.value);
  };

  const handleTextColor2Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTextColor2(e.target.value);
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

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
        severity: 'error',
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

      const projectManifest: ProjectManifest = {
        name: projectName,
        backgroundColor: backgroundColor,
        characterColor: [textColor1, textColor2],
        title: projectTitle,
        subtitle: projectSubtitle,
      };

      const result = await window.api.createProject({
        name: projectName,
        path: finalPath,
        manifest: projectManifest,
      });

      if (result.success) {
        setAlert({
          open: true,
          message: `项目 "${projectName}" 创建成功`,
          severity: 'success',
        });

        resetForm();
        onProjectCreated(projectName);
        onClose();
      } else {
        setAlert({
          open: true,
          message: result.message || '创建项目失败',
          severity: 'error',
        });
      }
    } catch (error) {
      console.error('创建项目失败:', error);
      setAlert({
        open: true,
        message: '创建项目时发生错误',
        severity: 'error',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setProjectName('');
    setProjectPath('');
    setNameError('');
    setPathError('');
    setProjectTitle('');
    setProjectSubtitle('');
    setBackgroundColor('#000000');
    setTextColor1('#FFFFFF');
    setTextColor2('#E0C410');
    setActiveTab(0);
  };

  const handleDialogClose = () => {
    resetForm();
    onClose();
  };

  const isNextDisabled =
    !projectName || !!nameError || !projectPath || !!pathError || isLoadingPath;

  return (
    <ThemeProvider theme={customTheme}>
      <Dialog open={open} onClose={handleDialogClose} fullWidth maxWidth="sm">
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h5">新建项目</Typography>
            <IconButton edge="end" onClick={handleDialogClose} aria-label="close">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label="project creation tabs">
            <Tab label="基本信息" />
            <Tab label="详细设置" disabled={isNextDisabled} />
          </Tabs>
        </Box>

        <DialogContent dividers>
          {activeTab === 0 ? (
            <Stack spacing={3} sx={{ mt: 1 }}>
              <TextField
                label="项目名称"
                value={projectName}
                onChange={handleProjectNameChange}
                error={!!nameError}
                helperText={nameError || '输入项目的名称，例如：English Words Learning'}
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
                helperText={pathError || '选择项目文件保存的位置'}
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
                  填写基本信息后，点击"下一步"进行详细设置。
                </Typography>
              </Box>
            </Stack>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
              <Box sx={{ width: '100%' }}>
                <TextField
                  label="视频标题"
                  value={projectTitle}
                  onChange={e => setProjectTitle(e.target.value)}
                  fullWidth
                  variant="outlined"
                  margin="normal"
                  helperText="视频中显示的主标题"
                />
              </Box>
              <Box sx={{ width: '100%' }}>
                <TextField
                  label="视频副标题"
                  value={projectSubtitle}
                  onChange={e => setProjectSubtitle(e.target.value)}
                  fullWidth
                  variant="outlined"
                  margin="normal"
                  helperText="视频中显示的副标题"
                />
              </Box>

              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle1">视频外观设置</Typography>

              <Box sx={{ width: '100%' }}>
                <FormControl fullWidth variant="outlined" margin="normal">
                  <InputLabel shrink htmlFor="background-color">
                    背景颜色
                  </InputLabel>
                  <Box sx={{ display: 'flex', mt: 2, ml: 1 }}>
                    <input
                      ref={backgroundColorRef}
                      type="color"
                      id="background-color"
                      value={backgroundColor}
                      onChange={handleBackgroundColorChange}
                      style={{
                        width: '50px',
                        height: '36px',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '2px',
                      }}
                    />
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ ml: 2, alignSelf: 'center' }}
                    >
                      {backgroundColor}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, ml: 1 }}>
                    视频背景颜色 (点击色块选择)
                  </Typography>
                </FormControl>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2 }}>
                <Box sx={{ width: '50%' }}>
                  <FormControl fullWidth variant="outlined" margin="normal">
                    <InputLabel shrink htmlFor="text-color-1">
                      文字颜色 1
                    </InputLabel>
                    <Box sx={{ display: 'flex', mt: 2, ml: 1 }}>
                      <input
                        ref={textColor1Ref}
                        type="color"
                        id="text-color-1"
                        value={textColor1}
                        onChange={handleTextColor1Change}
                        style={{
                          width: '50px',
                          height: '36px',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '2px',
                        }}
                      />
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ ml: 1, alignSelf: 'center' }}
                      >
                        默认文字颜色
                      </Typography>
                    </Box>
                  </FormControl>
                </Box>
                <Box sx={{ width: '50%' }}>
                  <FormControl fullWidth variant="outlined" margin="normal">
                    <InputLabel shrink htmlFor="text-color-2">
                      文字颜色 2
                    </InputLabel>
                    <Box sx={{ display: 'flex', mt: 2, ml: 1 }}>
                      <input
                        ref={textColor2Ref}
                        type="color"
                        id="text-color-2"
                        value={textColor2}
                        onChange={handleTextColor2Change}
                        style={{
                          width: '50px',
                          height: '36px',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '2px',
                        }}
                      />
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ ml: 1, alignSelf: 'center' }}
                      >
                        高亮文字颜色
                      </Typography>
                    </Box>
                  </FormControl>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleDialogClose} color="inherit">
            取消
          </Button>
          {activeTab === 0 ? (
            <Button
              onClick={() => setActiveTab(1)}
              color="primary"
              variant="contained"
              disabled={isNextDisabled}
            >
              下一步
            </Button>
          ) : (
            <>
              <Button onClick={() => setActiveTab(0)} color="inherit">
                上一步
              </Button>
              <Button
                onClick={handleCreateProject}
                color="primary"
                variant="contained"
                disabled={isCreating}
              >
                {isCreating ? '创建中...' : '创建项目'}
              </Button>
            </>
          )}
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
