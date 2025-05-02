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
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { customTheme } from './App';
import iconPath from './assets/icon.png';

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
  preference: {
    fetchWhenAddItem: boolean;
  };
}

interface TabPanelProps {
  children: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  const overflowStyle = index === 2 ? 'hidden' : 'auto';

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      style={{ width: '100%', overflow: overflowStyle }}
      {...other}
    >
      {value === index && (
        <Box
          sx={{
            py: 1,
            width: '100%',
            height: '100%',
            overflow: overflowStyle,
          }}
        >
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `settings-tab-${index}`,
    'aria-controls': `settings-tabpanel-${index}`,
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
    preference: {
      fetchWhenAddItem: false,
    },
  });

  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({
    open: false,
    message: '',
    severity: 'success' as AlertColor,
  });
  const [tabValue, setTabValue] = useState(0);
  const [version, setVersion] = useState<string>('');
  const [authors, setAuthors] = useState<string[]>([]);

  const fullScreen = useMediaQuery(customTheme.breakpoints.down('sm'));

  useEffect(() => {
    if (open) {
      const fetchConfig = async () => {
        try {
          setLoading(true);
          const result = await window.api.getConfig();
          setConfig(result);

          const versionInfo = await window.api.getMetadata();
          setVersion(versionInfo.version);
          setAuthors(versionInfo.authors);
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

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
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

        <Box sx={{ width: '100%', borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="设置选项卡"
            variant="fullWidth"
            centered
          >
            <Tab label="偏好" {...a11yProps(0)} />
            <Tab label="API配置" {...a11yProps(1)} />
            <Tab label="关于" {...a11yProps(2)} />
          </Tabs>
        </Box>

        <DialogContent dividers sx={{ p: 0, overflow: 'auto', maxHeight: 'calc(100vh - 180px)' }}>
          {loading ? (
            <Box textAlign="center" py={3}>
              <Typography>加载中...</Typography>
            </Box>
          ) : (
            <Box sx={{ width: '100%' }}>
              <TabPanel value={tabValue} index={0}>
                <Box p={2}>
                  <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                    基本偏好设置
                  </Typography>

                  <Box display="flex" alignItems="center" mt={2}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={config.preference.fetchWhenAddItem}
                          onChange={e => {
                            setConfig(prev => ({
                              ...prev,
                              preference: {
                                ...prev.preference,
                                fetchWhenAddItem: e.target.checked,
                              },
                            }));
                          }}
                        />
                      }
                      label="添加项目时自动获取数据"
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" mt={1} ml={3}>
                    启用后，添加新词条时会自动获取相关的音频和图片
                  </Typography>
                </Box>
              </TabPanel>

              <TabPanel value={tabValue} index={1}>
                <Box p={2}>
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
                </Box>
              </TabPanel>

              <TabPanel value={tabValue} index={2}>
                <Box
                  display="flex"
                  flexDirection="column"
                  alignItems="center"
                  p={2}
                  sx={{
                    width: '100%',
                    maxWidth: '100%',
                    overflow: 'hidden',
                    boxSizing: 'border-box',
                    height: '100%',
                  }}
                >
                  <Box
                    component="img"
                    src={iconPath}
                    alt="YoudaoPronouncer"
                    sx={{
                      height: 100,
                      width: 100,
                      mb: 2,
                    }}
                  />
                  <Typography
                    variant="h5"
                    gutterBottom
                    fontWeight="bold"
                    textAlign="center"
                    sx={{ wordBreak: 'break-word', maxWidth: '100%', mb: 0.5 }}
                  >
                    YoudaoPronouncer
                  </Typography>
                  <Typography
                    variant="body1"
                    gutterBottom
                    textAlign="center"
                    sx={{ wordBreak: 'break-word', maxWidth: '100%', mb: 1 }}
                  >
                    版本: {version}
                  </Typography>
                  <Typography
                    variant="subtitle2"
                    gutterBottom
                    mt={1.5}
                    textAlign="center"
                    sx={{ wordBreak: 'break-word', maxWidth: '100%', mb: 0.5 }}
                  >
                    开发者
                  </Typography>
                  <Box
                    sx={{
                      width: '100%',
                      maxWidth: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                    }}
                  >
                    {authors.map((author, index) => (
                      <Typography
                        key={index}
                        variant="body2"
                        textAlign="center"
                        sx={{
                          wordBreak: 'break-word',
                          maxWidth: '100%',
                          overflowWrap: 'break-word',
                        }}
                      >
                        {author}
                      </Typography>
                    ))}
                  </Box>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    mt={2}
                    textAlign="center"
                    sx={{ wordBreak: 'break-word', maxWidth: '100%' }}
                  >
                    一款辅助英语发音学习的工具
                  </Typography>
                </Box>
              </TabPanel>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="inherit">
            {tabValue !== 2 ? '取消' : '关闭'}
          </Button>
          {tabValue !== 2 && (
            <Button onClick={handleSave} color="primary" variant="contained" disabled={loading}>
              保存
            </Button>
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
