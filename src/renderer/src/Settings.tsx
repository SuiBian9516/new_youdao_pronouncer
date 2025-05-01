import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Button,
  Typography,
  Box,
  IconButton,
  useMediaQuery,
  Snackbar,
  Alert,
  AlertColor,
  ThemeProvider,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { customTheme } from './App';

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

interface Config {
  youdao: {
    appKey: string;
    key: string;
  };
  pixabay: {
    key: string;
  };
  deepseek: {
    apiKey: string;
  };
}

export default function SettingsDialog({ open, onClose }: SettingsDialogProps) {
  const [config, setConfig] = useState<Config>({
    youdao: {
      appKey: '',
      key: '',
    },
    pixabay: {
      key: '',
    },
    deepseek: {
      apiKey: '',
    },
  });

  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({
    open: false,
    message: '',
    severity: 'success' as AlertColor,
  });

  const fullScreen = useMediaQuery(customTheme.breakpoints.down('sm'));

  useEffect(() => {
    if (open) {
      const fetchConfig = async () => {
        try {
          setLoading(true);
          const result = await window.api.getConfig();
          setConfig(result);
        } catch (error) {
          console.error('获取配置失败:', error);
          setAlert({
            open: true,
            message: '获取配置失败',
            severity: 'error',
          });
        } finally {
          setLoading(false);
        }
      };

      fetchConfig();
    }
  }, [open]);

  const handleChange = (
    section: 'youdao' | 'pixabay' | 'deepseek',
    field: string,
    value: string
  ) => {
    setConfig(prevConfig => ({
      ...prevConfig,
      [section]: {
        ...prevConfig[section],
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    try {
      await window.api.saveConfig(config);
      setAlert({
        open: true,
        message: '设置已保存',
        severity: 'success',
      });
      onClose();
    } catch (error) {
      console.error('保存配置失败:', error);
      setAlert({
        open: true,
        message: '保存配置失败',
        severity: 'error',
      });
    }
  };

  const handleCloseAlert = () => {
    setAlert({ ...alert, open: false });
  };

  return (
    <ThemeProvider theme={customTheme}>
      <Dialog open={open} onClose={onClose} fullScreen={fullScreen} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">设置</Typography>
            <IconButton edge="end" onClick={onClose} aria-label="close">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {loading ? (
            <Box textAlign="center" py={3}>
              <Typography>加载中...</Typography>
            </Box>
          ) : (
            <>
              <Box mb={3}>
                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                  有道翻译API设置
                </Typography>
                <TextField
                  fullWidth
                  margin="dense"
                  label="应用ID"
                  value={config.youdao.appKey}
                  onChange={e => handleChange('youdao', 'appKey', e.target.value)}
                  variant="outlined"
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  margin="dense"
                  label="应用密钥"
                  value={config.youdao.key}
                  onChange={e => handleChange('youdao', 'key', e.target.value)}
                  variant="outlined"
                  type="password"
                />
                <Typography variant="body2" color="text.secondary" mt={1}>
                  用于获取在线音频文件
                </Typography>
                <Button
                  variant="text"
                  color="primary"
                  size="small"
                  sx={{ mt: 1 }}
                  onClick={() => {
                    window.electron.ipcRenderer.send('open-external', 'https://ai.youdao.com/');
                  }}
                >
                  前往有道智云
                </Button>
              </Box>

              <Box mt={4} mb={3}>
                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                  Pixabay API设置
                </Typography>
                <TextField
                  fullWidth
                  margin="dense"
                  label="API密钥"
                  value={config.pixabay.key}
                  onChange={e => handleChange('pixabay', 'key', e.target.value)}
                  variant="outlined"
                />
                <Typography variant="body2" color="text.secondary" mt={1}>
                  用于获取在线的图片
                </Typography>
                <Button
                  variant="text"
                  color="primary"
                  size="small"
                  sx={{ mt: 1 }}
                  onClick={() => {
                    window.electron.ipcRenderer.send(
                      'open-external',
                      'https://pixabay.com/api/docs/'
                    );
                  }}
                >
                  前往Pixabay开发者页面
                </Button>
              </Box>

              <Box mt={4}>
                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                  DeepSeek API设置
                </Typography>
                <TextField
                  fullWidth
                  margin="dense"
                  label="API密钥"
                  value={config.deepseek.apiKey}
                  onChange={e => handleChange('deepseek', 'apiKey', e.target.value)}
                  variant="outlined"
                  type="password"
                />
                <Typography variant="body2" color="text.secondary" mt={1}>
                  用于AI辅助使用软件
                </Typography>
                <Button
                  variant="text"
                  color="primary"
                  size="small"
                  sx={{ mt: 1 }}
                  onClick={() => {
                    window.electron.ipcRenderer.send(
                      'open-external',
                      'https://platform.deepseek.com/'
                    );
                  }}
                >
                  前往DeepSeek官网
                </Button>
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="inherit">
            取消
          </Button>
          <Button onClick={handleSave} color="primary" variant="contained" disabled={loading}>
            保存
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
