
import { useState, useEffect } from 'react';
import { Stack, Typography, Box, Chip, Divider } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { AppCard, AppLayout } from '../ui';
import { useWallet } from '../hooks/useWallet';
import { useUserProfile } from '../hooks/useUserProfile';
import { UserStats } from '../components/UserStats';
import { SettingsSection } from '../components/SettingsSection';
import TransactionTable from '../components/TransactionTables';
import { buildRoute } from '../routing/constants';
import type { Transaction } from '../types/transaction';

const TIMELINE_LIMIT = 8;

function getTimelineLabel(tx: Transaction, address: string) {
  if (tx.to === address) {
    return tx.type === 'payment' ? 'Received payout' : 'Incoming transfer';
  }

  if (tx.from === address) {
    return tx.type === 'payment' ? 'Submitted contribution' : 'Outgoing transfer';
  }

  return 'Transaction';
}

/**
 * Profile page - user profile, stats, participation history, and settings
 */
export default function ProfilePage() {
  const { address: routeAddress } = useParams<{ address?: string }>();
  const navigate = useNavigate();
  const { activeAddress } = useWallet();
  const profileAddress = routeAddress || activeAddress || undefined;
  const { profile, isLoading: profileLoading, error } = useUserProfile(profileAddress);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!routeAddress && activeAddress) {
      navigate(buildRoute.profile(activeAddress), { replace: true });
    }
  }, [routeAddress, activeAddress, navigate]);

  const transactions = profile?.timeline ?? [];

  const handleTransactionClick = (tx: Transaction) => {
    console.log('Transaction clicked:', tx);
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'history', label: 'Transaction History' },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <AppLayout
      title="Profile"
      subtitle="Review savings history, total contributions, and group participation."
      footerText="Stellar Save - Built for transparent, on-chain savings"
    >
      <Stack spacing={3}>
        <AppCard>
          <Stack spacing={2}>
            <Typography variant="h2">Member Profile</Typography>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: { xs: 'flex-start', sm: 'center' } }}>
              <Typography color="text.secondary">
                Address: {profileAddress || 'Not connected'}
              </Typography>
              {profile && (
                <Typography color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                  Member since: {profile.joinDate.toLocaleDateString()}
                </Typography>
              )}
            </Box>
            {profile?.name && (
              <Chip label={profile.name} color="primary" size="small" />
            )}
          </Stack>
        </AppCard>

        <AppCard>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Box sx={{ display: 'flex', gap: 0 }}>
              {tabs.map((tab) => (
                <Box
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  sx={{
                    px: 3,
                    py: 2,
                    cursor: 'pointer',
                    borderBottom: activeTab === tab.id ? 2 : 0,
                    borderColor: 'primary.main',
                    bgcolor: activeTab === tab.id ? 'action.selected' : 'transparent',
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                    transition: 'all 0.2s',
                  }}
                >
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: activeTab === tab.id ? 600 : 400,
                      color: activeTab === tab.id ? 'primary.main' : 'text.secondary',
                    }}
                  >
                    {tab.label}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>

          <Box sx={{ mt: 3 }}>
            {activeTab === 'overview' && (
              <Stack spacing={3}>
                {profileLoading ? (
                  <Typography>Loading profile...</Typography>
                ) : error ? (
                  <Typography color="error">{error}</Typography>
                ) : profile ? (
                  <>
                    <UserStats stats={profile.stats} />

                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                        <Typography variant="h3">Participation Timeline</Typography>
                        <Typography color="text.secondary" variant="body2">
                          Showing the latest {Math.min(transactions.length, TIMELINE_LIMIT)} events
                        </Typography>
                      </Box>

                      {transactions.length === 0 ? (
                        <Typography color="text.secondary">No savings history found yet.</Typography>
                      ) : (
                        <Stack spacing={2}>
                          {transactions.slice(0, TIMELINE_LIMIT).map((tx) => (
                            <Box key={tx.id} sx={{ p: 2, borderRadius: 2, border: 1, borderColor: 'divider' }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                                <Typography variant="subtitle2">{getTimelineLabel(tx, profile.address)}</Typography>
                                <Typography variant="subtitle2" color="text.secondary">
                                  {new Date(tx.createdAt).toLocaleDateString()}
                                </Typography>
                              </Box>

                              <Divider sx={{ my: 1 }} />

                              <Box sx={{ display: 'grid', gap: 1 }}>
                                <Typography>
                                  Amount: <strong>{tx.amount} {tx.assetCode}</strong>
                                </Typography>
                                <Typography color="text.secondary">
                                  From: {tx.from}
                                </Typography>
                                <Typography color="text.secondary">
                                  To: {tx.to || 'Unknown'}
                                </Typography>
                                {tx.memo && (
                                  <Typography color="text.secondary">Memo: {tx.memo}</Typography>
                                )}
                              </Box>
                            </Box>
                          ))}
                        </Stack>
                      )}
                    </Box>
                  </>
                ) : (
                  <Typography>No profile data available for this address.</Typography>
                )}
              </Stack>
            )}

            {activeTab === 'history' && (
              <Stack spacing={3}>
                <Typography variant="h3">Transaction History</Typography>
                <TransactionTable
                  transactions={transactions}
                  isLoading={profileLoading}
                  onRowClick={handleTransactionClick}
                />
              </Stack>
            )}

            {activeTab === 'settings' && (
              <SettingsSection />
            )}
          </Box>
        </AppCard>
      </Stack>
    </AppLayout>
  );
}
