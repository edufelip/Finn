package com.example.finn.adapters;

import androidx.annotation.NonNull;
import androidx.fragment.app.Fragment;
import androidx.fragment.app.FragmentManager;
import androidx.lifecycle.Lifecycle;
import androidx.viewpager2.adapter.FragmentStateAdapter;

import com.example.finn.activities.profileFragments.CommentsFragment;
import com.example.finn.activities.profileFragments.LikesFragment;
import com.example.finn.activities.profileFragments.PostsFragment;

public class FragmentsAdapter extends FragmentStateAdapter {
    public FragmentsAdapter(@NonNull FragmentManager fragmentManager, Lifecycle lifecycle) {
        super(fragmentManager, lifecycle);
    }

    @NonNull
    @Override
    public Fragment createFragment(int position) {
        switch (position) {
            case 1:
                return new PostsFragment();
            case 2:
                return new CommentsFragment();
        }
        // case 3
        return new LikesFragment();
    }

    @Override
    public int getItemCount() {
        return 3;
    }
}