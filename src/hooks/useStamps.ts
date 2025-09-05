import { useMemo } from 'react';
import { Q } from '@nozbe/watermelondb';
import { getDatabase } from '../database/database';
import { StampModel } from '../database/models';

export function useStamps() {
  const database = getDatabase();

  const stamps = useMemo(() => {
    if (!database) return null;
    return database.get<StampModel>('stamps').query();
  }, [database]);

  const getStampsByGoal = (goalId: string) => {
    if (!database) return null;
    return database.get<StampModel>('stamps').query(
      Q.where('goal_id', goalId),
      Q.sortBy('date', Q.desc)
    );
  };

  const getTotalStamps = async (): Promise<number> => {
    if (!database) return 0;
    const allStamps = await database.get<StampModel>('stamps').query().fetch();
    return allStamps.length;
  };

  const getStampsThisMonth = async (): Promise<number> => {
    if (!database) return 0;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const stamps = await database.get<StampModel>('stamps').query(
      Q.where('date', Q.gte(startOfMonth.getTime())),
      Q.where('date', Q.lte(endOfMonth.getTime()))
    ).fetch();

    return stamps.length;
  };

  const getStampsThisWeek = async (): Promise<number> => {
    if (!database) return 0;
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const stamps = await database.get<StampModel>('stamps').query(
      Q.where('date', Q.gte(startOfWeek.getTime()))
    ).fetch();

    return stamps.length;
  };

  const getCurrentStreak = async (): Promise<number> => {
    if (!database) return 0;
    const stamps = await database.get<StampModel>('stamps').query(
      Q.sortBy('date', Q.desc)
    ).fetch();

    if (stamps.length === 0) return 0;

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (const stamp of stamps) {
      const stampDate = new Date(stamp.date);
      stampDate.setHours(0, 0, 0, 0);

      const diffDays = Math.floor((currentDate.getTime() - stampDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === streak) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else if (diffDays > streak) {
        break;
      }
    }

    return streak;
  };

  return {
    stamps,
    getStampsByGoal,
    getTotalStamps,
    getStampsThisMonth,
    getStampsThisWeek,
    getCurrentStreak,
  };
}