import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  IconButton,
  CircularProgress,
  ThemeProvider,
  InputLabel,
  FormControl,
} from '@mui/material';
import { customTheme } from './App';
import CloseIcon from '@mui/icons-material/Close';

interface ProjectManifest {
  name: string;
  backgroundColor: string;
  characterColor: [string, string];
  title: string;
  subtitle: string;
}

interface ProjectManifestEditorProps {
  open: boolean;
  onClose: () => void;
  projectName: string | null;
  initialLoading?: boolean;
  onSave: (manifest: ProjectManifest) => Promise<void>;
}

export default function ProjectManifestEditor({
  open,
  onClose,
  projectName,
  initialLoading = false,
  onSave,
}: ProjectManifestEditorProps) {
  const [projectManifest, setProjectManifest] = useState<ProjectManifest | null>(null);
  const [loading, setLoading] = useState(initialLoading);

  const backgroundColorRef = useRef<HTMLInputElement>(null);
  const textColor1Ref = useRef<HTMLInputElement>(null);
  const textColor2Ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && projectName) {
      loadProjectManifest(projectName);
    }
  }, [open, projectName]);

  const loadProjectManifest = async (projectName: string) => {
    try {
      setLoading(true);
      const result = await window.api.getProjectManifest(projectName);

      if (result.success) {
        setProjectManifest(result.manifest ?? null);
      }
    } catch (error) {
      console.error('获取项目信息失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ProjectManifest, value: string) => {
    if (!projectManifest) return;

    setProjectManifest({
      ...projectManifest,
      [field]: value,
    });
  };

  const collectColorValues = useCallback(() => {
    if (!projectManifest) return null;

    const backgroundColor = backgroundColorRef.current?.value || projectManifest.backgroundColor;
    const textColor1 = textColor1Ref.current?.value || projectManifest.characterColor[0];
    const textColor2 = textColor2Ref.current?.value || projectManifest.characterColor[1];

    return {
      ...projectManifest,
      backgroundColor,
      characterColor: [textColor1, textColor2] as [string, string],
    };
  }, [projectManifest]);

  const handleSave = async () => {
    const updatedManifest = collectColorValues();
    if (!updatedManifest) return;

    try {
      setLoading(true);
      await onSave(updatedManifest);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider theme={customTheme}>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">编辑项目信息</Typography>
            <IconButton edge="end" onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="200px">
              <CircularProgress />
            </Box>
          ) : projectManifest ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box sx={{ width: '100%' }}>
                <TextField
                  label="项目名称"
                  value={projectManifest.name}
                  disabled
                  fullWidth
                  variant="outlined"
                  margin="normal"
                />
              </Box>
              <Box sx={{ width: '100%' }}>
                <TextField
                  label="项目标题"
                  value={projectManifest.title}
                  onChange={e => handleInputChange('title', e.target.value)}
                  fullWidth
                  variant="outlined"
                  margin="normal"
                  helperText="视频中显示的主标题"
                />
              </Box>
              <Box sx={{ width: '100%' }}>
                <TextField
                  label="项目副标题"
                  value={projectManifest.subtitle}
                  onChange={e => handleInputChange('subtitle', e.target.value)}
                  fullWidth
                  variant="outlined"
                  margin="normal"
                  helperText="视频中显示的副标题"
                />
              </Box>
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
                      defaultValue={projectManifest.backgroundColor}
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
                      {backgroundColorRef.current?.value || projectManifest.backgroundColor}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, ml: 1 }}>
                    视频背景颜色
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
                        defaultValue={projectManifest.characterColor[0]}
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
                        defaultValue={projectManifest.characterColor[1]}
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
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="inherit">
            取消
          </Button>
          <Button
            onClick={handleSave}
            color="primary"
            variant="contained"
            disabled={loading || !projectManifest}
          >
            保存
          </Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
}
