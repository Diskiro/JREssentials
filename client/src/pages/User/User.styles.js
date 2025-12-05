import { styled } from '@mui/material/styles';
import {
    Container,
    Grid,
    Paper,
    Avatar,
    Box,
    Divider,
    Button,
    ListItem,
    Typography,
    Tabs,
    Chip
} from '@mui/material';

export const StyledContainer = styled(Container)(({ theme }) => ({
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4),
}));

export const StyledGrid = styled(Grid)(({ theme }) => ({
    '&.MuiGrid-root.MuiGrid-container.MuiGrid-direction-xs-row.MuiGrid-spacing-xs-4': {
        width: '100%',
        '& .css-jy3ru-MuiGrid-root': { 
            [theme.breakpoints.down('sm')]: {
                width: '100%',
            }
        }
    },
    [theme.breakpoints.up('md')]: {
        '&.MuiGrid-root.MuiGrid-container.MuiGrid-direction-xs-row.MuiGrid-spacing-xs-4': {
            justifyContent: 'center',
            display: 'flex',
        }
    },
}));

export const StyledPaper = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(3),
    [theme.breakpoints.down('sm')]: {
        width: '100%',
    }
}));

export const StyledAvatar = styled(Avatar)(({ theme }) => ({
    width: 100,
    height: 100,
    margin: '0 auto 16px',
    backgroundColor: theme.palette.primary.main,
}));

export const StyledProfileBox = styled(Box)(({ theme }) => ({
    textAlign: 'center',
    marginBottom: theme.spacing(3),
}));

export const StyledDivider = styled(Divider)(({ theme }) => ({
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
}));

export const StyledEditButton = styled(Button)(({ theme }) => ({
    marginTop: theme.spacing(2),
}));

export const StyledOrderItem = styled(ListItem)(({ theme }) => ({
    cursor: 'pointer',
    '&:hover': {
        backgroundColor: theme.palette.action.hover,
    },
}));

export const StyledOrderHeader = styled(Box)({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexDirection: 'column',
    marginBottom: '10px',
});

export const StyledOrderDate = styled(Typography)({
    display: 'block',
});

export const StyledTabs = styled(Tabs)(({ theme }) => ({
    marginBottom: theme.spacing(3),
}));

export const StyledEmptyState = styled(Typography)(({ theme }) => ({
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4),
    textAlign: 'center',
}));

export const StyledLoadingContainer = styled(Container)(({ theme }) => ({
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4),
    display: 'flex',
    justifyContent: 'center',
}));

export const StyledErrorContainer = styled(Container)(({ theme }) => ({
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4),
}));

export const StyledStatusChip = styled(Chip)(({ theme }) => ({
    '&.MuiChip-root': {
        fontWeight: 500,
        display: 'flex',
        '&.MuiChip-colorWarning': {
            backgroundColor: theme.palette.warning.light,
            color: theme.palette.warning.dark,
        },
        '&.MuiChip-colorSuccess': {
            backgroundColor: theme.palette.success.light,
            color: theme.palette.success.dark,
        },
        '&.MuiChip-colorError': {
            backgroundColor: theme.palette.error.light,
            color: theme.palette.error.dark,
        },
        '&.MuiChip-colorDefault': {
            backgroundColor: theme.palette.grey[200],
            color: theme.palette.grey[700],
        }
    }
}));

export const StyledFavoritesGrid = styled(Grid)(({ theme }) => ({
    display: 'grid',    
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: theme.spacing(3),
    padding: theme.spacing(2),
    [theme.breakpoints.down('sm')]: {
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: theme.spacing(2),
    }
}));

export const StyledFavoritesContainer = styled(Box)(({ theme }) => ({
    padding: theme.spacing(2),
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.shape.borderRadius,
    boxShadow: theme.shadows[1],
}));

export const StyledFavoritesTitle = styled(Typography)(({ theme }) => ({
    marginBottom: theme.spacing(3),
    fontWeight: 500,
    color: theme.palette.text.primary,
}));

export const StyledEmptyFavorites = styled(Box)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing(4),
    textAlign: 'center',
    '& .MuiTypography-root': {
        marginBottom: theme.spacing(2),
        color: theme.palette.text.secondary,
    }
}));

export const StyledFavoritesLoading = styled(Box)(({ theme }) => ({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '200px',
    width: '100%'
})); 