/* Interações dos filtros da Fábrica; preserva campos, layout e controlador compartilhado. */
class FeedFilterController extends FilterController {
  isMobile(){return matchMedia('(max-width:767px)').matches;}
  buildMulti(field){
    const state=super.buildMulti(field);
    if(!state||state.feedEnhanced)return state;
    state.feedEnhanced=true;
    state.button.setAttribute('aria-label',field.label);
    if(state.search){
      state.search.placeholder=this.isMobile()?'Digite para buscar...':'Pesquisar...';
      state.search.setAttribute('aria-label',`Buscar em ${field.label}`);
      const clear=document.createElement('button');clear.type='button';clear.className='feed-filter-clear-search';
      clear.textContent='×';clear.hidden=true;clear.title='Limpar busca';clear.setAttribute('aria-label',`Limpar busca de ${field.label}`);
      state.search.parentElement.append(clear);state.feedClearSearch=clear;
      clear.addEventListener('click',()=>{state.search.value='';this.applySearch(field);state.search.focus({preventScroll:true});});
    }
    const empty=document.createElement('p');empty.className='feed-filter-empty';empty.textContent='Nenhum resultado';empty.hidden=true;empty.setAttribute('role','status');
    state.panel.append(empty);state.feedEmpty=empty;
    state.host.addEventListener('keydown',event=>{
      if(this.isMobile()&&event.key==='Escape'){event.preventDefault();event.stopPropagation();this.closeAll();state.button.focus({preventScroll:true});}
    });
    state.list.addEventListener('change',()=>this.applySearch(field));
    return state;
  }
  applySearch(field){
    super.applySearch(field);
    const state=this.getState(field);
    if(state.search)state.search.placeholder=this.isMobile()?'Digite para buscar...':'Pesquisar...';
    if(!this.isMobile()){
      if(state.feedClearSearch)state.feedClearSearch.hidden=true;
      if(state.feedEmpty)state.feedEmpty.hidden=true;
      return;
    }
    const visible=[...(state.list?.querySelectorAll('[data-filter-option]')||[])]
      .filter(row=>!row.hidden&&!row.querySelector('[data-all]'));
    if(state.feedClearSearch)state.feedClearSearch.hidden=!state.search.value;
    if(state.feedEmpty)state.feedEmpty.hidden=visible.length>0;
    const all=state.list?.querySelector('[data-all]');
    if(all){
      const count=visible.filter(row=>state.selected.has(row.querySelector('input').value)).length;
      all.checked=visible.length>0&&count===visible.length;
      all.indeterminate=count>0&&count<visible.length;
      all.disabled=visible.length===0;
      all.setAttribute('aria-checked',all.indeterminate?'mixed':String(all.checked));
    }
  }
  renderMultiOptions(field,options,selected){
    super.renderMultiOptions(field,options,selected);
    const state=this.getState(field),all=state.list?.querySelector('[data-all]');
    if(!all)return;
    // Like Matrizes, Select all acts on search results and preserves other selections.
    all.addEventListener('change',async event=>{
      if(!this.isMobile())return;
      event.stopImmediatePropagation();if(this.silent)return;
      for(const row of state.list.querySelectorAll('[data-filter-option]')){
        if(row.hidden||row.querySelector('[data-all]'))continue;
        const input=row.querySelector('input');
        if(all.checked)state.selected.add(input.value);else state.selected.delete(input.value);
        input.checked=all.checked;
      }
      this.applySearch(field);this.updateButton(field);await this.emitChange();
    },true);
    this.applySearch(field);
  }
  clear(){
    if(!this.isMobile())return super.clear();
    // Clear search terms as well as selections, without changing available fields.
    this.multiState.forEach(state=>{if(state.search)state.search.value='';});
    super.clear();this.closeAll();
  }
  clearMobileFilters(){
    this.clear();
    for(const [id,bound] of [['feedStart','min'],['feedEnd','max']]){
      const input=document.getElementById(id);if(input?.[bound])input.value=input[bound];
    }
    this.feedPhaseReset=true;
  }
}
