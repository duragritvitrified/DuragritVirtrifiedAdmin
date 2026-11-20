import React, { useMemo, useState } from 'react';
import { ArrowLeft, Gift, Sparkles, CheckCircle2, Lock, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import img1500 from '../assets/gift-rewards/1500.jpg?inline';
import img2000 from '../assets/gift-rewards/2000.jpg?inline';
import img2500 from '../assets/gift-rewards/2500.jpg?inline';
import img3500 from '../assets/gift-rewards/3500.jpg?inline';
import img4500 from '../assets/gift-rewards/4500.jpg?inline';
import img5000 from '../assets/gift-rewards/5000.jpg?inline';
import img5500 from '../assets/gift-rewards/5500.jpg?inline';
import img6000 from '../assets/gift-rewards/6000.jpg?inline';
import img7000 from '../assets/gift-rewards/7000.jpg?inline';
import img15000 from '../assets/gift-rewards/15000.jpg?inline';

const GIFT_REWARDS = [
  { points: 1500, image: img1500 },
  { points: 2000, image: img2000 },
  { points: 2500, image: img2500 },
  { points: 3500, image: img3500 },
  { points: 4500, image: img4500 },
  { points: 5000, image: img5000 },
  { points: 5500, image: img5500 },
  { points: 6000, image: img6000 },
  { points: 7000, image: img7000 },
  { points: 15000, image: img15000 }
];

export function Step15_GiftRewards({ onBack }) {
  const { currentUser } = useAuth();
  const { claims = [], vendors = [] } = useData();
  const [previewGift, setPreviewGift] = useState(null);

  const totalEarnedPoints = useMemo(() => {
    const myMobile = String(currentUser?.mobile || currentUser?.phone || '').replace(/\D/g, '').slice(-10);
    const myVendorId = String(currentUser?.vendorId || currentUser?.id || '').toLowerCase();
    const myUserId = String(currentUser?.id || currentUser?.userId || '').toLowerCase();
    const myName = String(currentUser?.companyName || currentUser?.name || '').toLowerCase().trim();

    const matchedVendor = vendors.find((v) => {
      const vDigits = String(v.phone || v.mobile || '').replace(/\D/g, '').slice(-10);
      const vId = String(v.vendorId || v.id || '').toLowerCase();
      return (vId && myVendorId && vId === myVendorId) || (myMobile.length === 10 && vDigits === myMobile);
    });
    const resolvedVendorId = String(matchedVendor?.vendorId || matchedVendor?.id || myVendorId).toLowerCase();

    const userClaims = claims.filter((c) => {
      const cMobile = String(c.userMobile || c.mobile || '').replace(/\D/g, '').slice(-10);
      const cVendorId = String(c.vendorId || '').toLowerCase();
      const cUserId = String(c.userId || c.userSupabaseId || '').toLowerCase();
      const cName = String(c.userName || c.contractorName || c.vendorName || '').toLowerCase().trim();

      if (myMobile.length === 10 && cMobile === myMobile) return true;
      if (resolvedVendorId && cVendorId === resolvedVendorId) return true;
      if (myUserId && (cUserId === myUserId || cVendorId === myUserId)) return true;
      if (myName && cName && cName === myName) return true;
      return false;
    });

    return userClaims
      .filter((c) => c.status === 'Approved' || c.status === 'Disbursed')
      .reduce((sum, c) => sum + (Number(c.points ?? c.rewardPoints ?? (Number(c.amount || c.claimValue) * 10)) || 0), 0);
  }, [claims, vendors, currentUser]);

  const unlockedCount = GIFT_REWARDS.filter((g) => totalEarnedPoints >= g.points).length;

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-stone-900 font-sans flex flex-col">
      {/* Top Sticky Header */}
      <div className="bg-white px-4 py-3 border-b border-[#ECEAE6] flex items-center justify-between sticky top-0 z-30 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onBack}
            className="p-1.5 rounded-xl bg-[#FEF2EE] hover:bg-[#FCE3D9] text-[#A6300F] border border-[#F9CEB8] transition active:scale-95 cursor-pointer"
            title="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="font-extrabold text-sm text-stone-900 leading-tight flex items-center gap-1.5">
              <Gift className="w-4 h-4 text-[#A6300F]" />
              <span>Gift Rewards</span>
            </h1>
            <p className="text-[10px] text-stone-500 font-medium">
              Earn points on verified scans to unlock gifts
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1 font-mono text-[10px] font-black text-amber-800 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200 shadow-2xs">
          <Sparkles className="w-3 h-3 text-amber-600 shrink-0" />
          <span>{totalEarnedPoints.toLocaleString('en-IN')} Pts</span>
        </span>
      </div>

      {/* Main Content */}
      <main className="p-3.5 space-y-3.5 flex-1">
        {/* Points Banner */}
        <section className="bg-gradient-to-r from-[#A6300F] to-[#C84826] text-white rounded-2xl p-3.5 shadow-sm flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/80 block">
              Your Earned Points
            </span>
            <span className="text-xl font-black font-mono tracking-tight block mt-0.5">
              {totalEarnedPoints.toLocaleString('en-IN')} Pts
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/80 block">
              Rewards Catalog
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-extrabold bg-white/15 border border-white/25 px-2.5 py-1 rounded-xl mt-0.5">
              {unlockedCount} / {GIFT_REWARDS.length} Unlocked
            </span>
          </div>
        </section>

        {/* Static Gift Grid */}
        <section className="grid grid-cols-2 gap-3">
          {GIFT_REWARDS.map((gift) => {
            const isUnlocked = totalEarnedPoints >= gift.points;
            return (
              <button
                key={gift.points}
                type="button"
                onClick={() => setPreviewGift(gift)}
                className={`bg-white rounded-2xl border overflow-hidden shadow-2xs flex flex-col text-left transition active:scale-[0.98] cursor-pointer ${
                  isUnlocked
                    ? 'border-emerald-300 ring-1 ring-emerald-100'
                    : 'border-[#ECEAE6] hover:border-[#F9CEB8]'
                }`}
              >
                <div className="w-full aspect-square bg-white p-2 flex items-center justify-center border-b border-stone-100 relative">
                  <img
                    src={gift.image}
                    alt={`${gift.points} Points Gift Reward`}
                    loading="lazy"
                    className="w-full h-full object-contain rounded-lg"
                  />
                  <span
                    className={`absolute top-2 right-2 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold border ${
                      isUnlocked
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-stone-100 text-stone-600 border-stone-200'
                    }`}
                  >
                    {isUnlocked ? (
                      <>
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        <span>Eligible</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-2.5 h-2.5" />
                        <span>Locked</span>
                      </>
                    )}
                  </span>
                </div>

                {/* Points Below Image */}
                <div className="p-2.5 bg-gradient-to-b from-white to-[#FFF8F5] flex items-center justify-between gap-1">
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-stone-400 block">
                      Required Points
                    </span>
                    <span className="text-sm font-black font-mono text-[#A6300F] leading-tight">
                      {gift.points.toLocaleString('en-IN')} Pts
                    </span>
                  </div>
                  <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                </div>
              </button>
            );
          })}
        </section>
      </main>

      {/* Full Image Preview Modal */}
      {previewGift && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setPreviewGift(null)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl border border-stone-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 bg-[#A6300F] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gift className="w-4 h-4" />
                <span className="font-extrabold text-sm">
                  {previewGift.points.toLocaleString('en-IN')} Points Gift
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewGift(null)}
                className="p-1 rounded-lg hover:bg-white/15 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 bg-white flex items-center justify-center">
              <img
                src={previewGift.image}
                alt={`${previewGift.points} Points Gift`}
                className="w-full max-h-72 object-contain rounded-xl"
              />
            </div>
            <div className="px-4 py-3 bg-[#FAF9F6] border-t border-stone-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-stone-500 block">
                  Earn Points To Claim
                </span>
                <span className="text-base font-black font-mono text-[#A6300F]">
                  {previewGift.points.toLocaleString('en-IN')} Pts
                </span>
              </div>
              {totalEarnedPoints >= previewGift.points ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Unlocked!</span>
                </span>
              ) : (
                <span className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl font-mono">
                  {(previewGift.points - totalEarnedPoints).toLocaleString('en-IN')} Pts Left
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
