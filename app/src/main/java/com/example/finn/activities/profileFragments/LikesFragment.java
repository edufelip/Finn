package com.example.finn.activities.profileFragments;

import android.content.Intent;
import android.os.Bundle;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.lifecycle.Observer;
import androidx.lifecycle.ViewModelProvider;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import com.example.finn.R;
import com.example.finn.activities.PostActivity;
import com.example.finn.activities.homeFragments.HandleClick;
import com.example.finn.adapters.FeedRecyclerAdapter;
import com.example.finn.data.Post;
import com.example.finn.viewmodel.HomeFragmentViewModel;

import java.util.ArrayList;
import java.util.List;

public class LikesFragment extends Fragment implements FeedRecyclerAdapter.RecyclerClickListener  {

    private RecyclerView feed;
    private FeedRecyclerAdapter feedRecyclerAdapter;
    private ArrayList<Post> posts;
    private HandleClick handleClick;

    Post fakepost, fakepost2;

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_likes, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        initializeComponents();

        fakepost = new Post();
        fakepost.setId("1");
        fakepost.setUserName("Fake Username One");
        fakepost.setCommunityName("FakeSubreddit");
        fakepost.setTitle("Fake post title");
        fakepost.setLikes(212);
        fakepost.setComments(14);
        fakepost.setDescription("Fake description, random text, random words");

        fakepost2 = new Post();
        fakepost2.setId("12");
        fakepost2.setUserName("Faker Username Two");
        fakepost2.setCommunityName("SecondFakeSubreddit");
        fakepost2.setTitle("Another fake post title");
        fakepost2.setLikes(12);
        fakepost2.setComments(7);
        fakepost2.setDescription("Another fake post description with another fake words");

        posts.add(fakepost);
        posts.add(fakepost2);

        feedRecyclerAdapter = new FeedRecyclerAdapter(getContext(), posts, this);
        feed.setAdapter(feedRecyclerAdapter);
        feed.setLayoutManager(new LinearLayoutManager(getContext()));

//        LikesFragmentViewModel mViewModel = new ViewModelProvider(this).get(LikesFragmentViewModel.class);
//        mViewModel.getUserListObserver().observe(getViewLifecycleOwner(), new Observer<List<Post>>() {
//            @Override
//            public void onChanged(List<Post> posts) {
//                if(posts != null) {
//                    posts = posts;
//                    feedRecyclerAdapter.notifyDataSetChanged();
//                }
//            }
//        });
//        mViewModel.makeApiCall();
    }

    public void initializeComponents() {
        feed = getView().findViewById(R.id.likes_recyclerview);
        posts = new ArrayList<Post>();
    }

    public void setInterface(HandleClick handle) {
        this.handleClick = handle;
    }

    @Override
    public void onItemClick(int position) {
        Post post = posts.get(position);
        Intent intent = new Intent(getContext(), PostActivity.class);
        intent.putExtra("postId", post.getId());
        startActivity(intent);
    }

    @Override
    public void onDeleteClick(int position) {
        posts.remove(position);
        feedRecyclerAdapter.notifyItemRemoved(position);
    }
}