#include <iostream>
#include <cstdio>
#include <cstdlib>
#include <vector>
#include <map>
#include <cmath>
#include <cstring>
#include <algorithm>
using namespace std;

struct area
{
    int l, r;
    __int64 ans;
} areabuf[100005];
int _areaidx = 0;

area* newarea()
{
    return areabuf + _areaidx++;
}

bool cmp(area* a, area* b)
{
    if(a->r < b->r) return true;
    else
    if(a->r > b->r) return false;
    else return a->l < b->l;
}

inline __int64 cube(int a)
{
    return (__int64)((__int64)a * (__int64)a * (__int64)a);
}

__int64 initans(area* a, int num[], int times[])
{
    __int64 ans = 0.0f;
    for(int i = a->l; i <= a->r; i++)
    {
        int time = times[num[i]];
        if(time != 0) ans -= cube(time);
        times[num[i]]++;
        ans += cube(time + 1);
    }
    
    return ans;
}

int main()
{
    //freopen("data.in", "r", stdin);
    int n, tmp, q, l, r;
    int num[100005];
    int times[100005];
    area* atmp;
    
    while(~scanf("%d", &n))
    {
        _areaidx = 0;
        
        map<int, int> keys;
        for(int i = 0; i < n; i++)
        {
            scanf("%d", &tmp);
            if(keys.find(tmp) != keys.end())
            {
                num[i] = keys[tmp];
            }
            else
            {
                keys[tmp] = keys.size();
                num[i] = keys[tmp];
            }
        }
        
        int grouplen = sqrt(double(n));
        int groupcount = (n / grouplen) + (n % grouplen ? 1 : 0);
        
        vector<area*> ansarr;
        vector<area*> group[320];
        
        scanf("%d", &q);
        for(int i = 0; i < q; i++)
        {
            scanf("%d%d", &l, &r);
            atmp = newarea();
            atmp->l = l - 1, atmp->r = r - 1;
            
            int idx = (l - 1) / grouplen;
            group[idx].push_back(atmp);
            ansarr.push_back(atmp);
        }
        
        for(int i = 0; i < groupcount; i++)
        {
            if(group[i].size() == 0) continue;
            sort(group[i].begin(), group[i].end(), cmp);
            
            memset(times, 0, sizeof(times));
            __int64 ans = group[i][0]->ans = initans(group[i][0], num, times);
            
            for(int j = 1; j < group[i].size(); j++)
            {
                int l = group[i][j]->l;
                int r = group[i][j]->r;
                int pl = group[i][j - 1]->l;
                int pr = group[i][j - 1]->r;
                
                if(l > pl)
                {
                    for(int k = pl; k < l; k++)
                    {
                        int time = times[num[k]];
                        ans -= cube(time);
                        times[num[k]]--;
                        if(time != 1) ans += cube(time - 1);
                    }
                }
                else
                if(l < pl)
                {
                    for(int k = l; k < pl; k++)
                    {
                        int time = times[num[k]];
                        if(time != 0) ans -= cube(time);
                        times[num[k]]++;
                        ans += cube(time + 1);
                    }
                }
                
                for(int k = pr + 1; k <= r; k++)
                {
                    int time = times[num[k]];
                    if(time != 0) ans -= cube(time);
                    times[num[k]]++;
                    ans += cube(time + 1);
                }
                
                group[i][j]->ans = ans;
            }
        }
        
        for(int i = 0; i < q; i++)
        {
            printf("%I64u\n", ansarr[i]->ans);
        }
    }
    
    return 0;
}